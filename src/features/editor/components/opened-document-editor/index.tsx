import { type ReactElement, type ReactNode, useState } from "react";
import { ArtboardCanvas } from "@/features/editor/components/artboard-canvas";
import {
  DOCUMENT_ERROR_ORIGINS,
  DocumentErrorList,
} from "@/features/editor/components/document-error-list";
import { DocumentSyncFailureList } from "@/features/editor/components/document-sync-failure-list";
import { EditorLayout } from "@/features/editor/components/editor-layout";
import {
  EditorProvider,
  useEditor,
} from "@/features/editor/components/editor-provider";
import {
  EDITOR_TOP_BAR_TONES,
  EditorTopBar,
} from "@/features/editor/components/editor-top-bar";
import { LeftPane } from "@/features/editor/components/left-pane";
import {
  LEFT_PANE_VIEWS,
  type LeftPaneView,
} from "@/features/editor/components/left-pane-rail";
import { NodeInsertToolbar } from "@/features/editor/components/node-insert-toolbar";
import { PropertyPanel } from "@/features/editor/components/property-panel";
import { TokenEditor } from "@/features/editor/components/token-editor";
import type { DocumentError } from "@/features/editor/domains/document-error";
import { DocumentSaveState } from "@/features/editor/domains/document-save-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import type { OpenedDocument } from "@/features/editor/domains/opened-document";
import { useAutoSave } from "@/features/editor/hooks/use-auto-save";
import {
  type CanvasViewControl,
  useCanvasView,
} from "@/features/editor/hooks/use-canvas-view";
import { useDocumentReload } from "@/features/editor/hooks/use-document-reload";
import { useEditShortcuts } from "@/features/editor/hooks/use-edit-shortcuts";
import {
  type NodeActions,
  useNodeActions,
} from "@/features/editor/hooks/use-node-actions";
import {
  type TokenActions,
  useTokenActions,
} from "@/features/editor/hooks/use-token-actions";
import type { DocumentIpc } from "@/libs/document-ipc";

/**
 * 行き先ごとの右ペインの中身。`Assets` がプロパティパネルのままなのは、パレットは
 * 見るだけの場所で選択に触れないため
 * （UI 案「Assets is browse-only — the inspector keeps the previous selection」）。
 *
 * 戻り値を `ReactElement` と書いている理由は `LeftPaneContent` と同じ
 * （`case` の足し忘れをコンパイルエラーにする）。
 *
 * @returns Tokens ならトークンの編集欄、Layers / Assets ならプロパティパネル
 */
function RightPaneContent({
  view,
  state,
  node,
  token,
  onGoToSource,
}: Readonly<{
  view: LeftPaneView;
  state: EditorState;
  node: NodeActions;
  token: TokenActions;
  onGoToSource: () => void;
}>): ReactElement {
  const inspector = (
    <PropertyPanel
      state={state}
      onEditProp={node.editProp}
      onClearSelection={node.clearSelection}
      instance={{
        goToSource: onGoToSource,
        detach: node.detachInstance,
      }}
    />
  );

  /*
   * 凍結は行き先より先に見る。ファイルが不正な間はトークンも編集できないので、
   * Tokens を開いたまま壊れたときに編集欄が残らないようにする（#135）。
   * プロパティパネルが凍結時の中身（「選択は凍結中」）を持つ。
   */
  if (EditorState.isFileInvalid(state)) {
    return inspector;
  }

  switch (view) {
    case LEFT_PANE_VIEWS.tokens:
      return (
        <TokenEditor
          state={state}
          onSetTokenValue={token.setValue}
          onRenameToken={token.rename}
          onRemoveToken={token.remove}
        />
      );
    case LEFT_PANE_VIEWS.layers:
    case LEFT_PANE_VIEWS.assets:
      return inspector;
  }
}

/** キャンバス下端に出すもの。ファイルが不正な状態と、編集を続けられる状態の 2 つ（#128）。 */
type CanvasDock =
  | Readonly<{ kind: "file-invalid"; errors: readonly DocumentError[] }>
  | Readonly<{ kind: "editable"; errors: readonly DocumentError[] }>;

/**
 * 今どちらの状態かと、そこで出すエラーを決める。
 *
 * ファイルが不正な間は表示自体がファイルと食い違っているので、そちらの一覧だけを出す。
 * Why not: 2 つの一覧を並べると、外部エディタでしか直せないファイルの一覧が、
 * アプリ内で直せるドキュメントの一覧の場所を奪う。
 *
 * @param state エラーの出どころになるエディタの状態
 * @returns ファイルが不正ならそのエラー、そうでなければ編集で作ったエラー
 */
function canvasDock(state: EditorState): CanvasDock {
  if (EditorState.isFileInvalid(state)) {
    return { kind: "file-invalid", errors: state.fileErrors };
  }
  return { kind: "editable", errors: EditorState.documentErrors(state) };
}

/**
 * 下端に積む器。エラー一覧と挿入のツールバーが同じ場所を取り合うため、
 * 順序と間隔はここが持つ（各部品が浮くと重なる）。
 *
 * **この位置指定を落としてもテストは落ちない** — happy-dom はレイアウトを解決しない。
 * 気づく手段は `OpenedDocumentEditor / 編集で作った不正がある編集画面` の視覚差分だけ。
 *
 * @returns 子を縦に積み、キャンバスの下端に寄せる器
 */
function CanvasDockStack({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-3 px-4">
      {children}
    </div>
  );
}

/**
 * 下端の出し分け。戻り値を `ReactElement` と書いている理由は `RightPaneContent` と同じ。
 *
 * ドキュメント由来のときにツールバーを消さないのは、表示がファイルと一致していて
 * 古くないから。編集を続けたまま直せる（#128）。一覧は 0 件なら何も出さない。
 *
 * @returns ファイルが不正ならエラー一覧だけ、そうでなければエラー一覧と挿入のツールバー
 */
function CanvasDockContent({
  dock,
  node,
}: Readonly<{ dock: CanvasDock; node: NodeActions }>): ReactElement {
  switch (dock.kind) {
    case "file-invalid":
      return (
        <DocumentErrorList
          errors={dock.errors}
          origin={DOCUMENT_ERROR_ORIGINS.file}
        />
      );
    case "editable":
      return (
        <CanvasDockStack>
          <DocumentErrorList
            errors={dock.errors}
            origin={DOCUMENT_ERROR_ORIGINS.document}
          />
          <NodeInsertToolbar
            isInsertEnabled={node.isInsertEnabled}
            onInsert={node.insert}
          />
        </CanvasDockStack>
      );
  }
}

/**
 * Provider から状態を読んで各ペインへ配る。
 * 読み出しをここ 1 箇所に集めることで、ペインは props だけで描ける
 * （個別に単体描画・テストできる）。
 */
function EditorPanes({
  canvasView,
}: Readonly<{ canvasView: CanvasViewControl }>) {
  const { state } = useEditor();
  const node = useNodeActions();
  const token = useTokenActions();
  /**
   * 左ペインが何を映しているか（UI 案 docs/Design Composer.html のアイコンレール）。
   * 右ペインに出すのもこれで決まる（Tokens ならトークン編集、それ以外はプロパティ）。
   * 編集とは連動しない表示だけの状態なので `EditorState` には持たせず、
   * 両ペインを組むここに置く。
   */
  const [leftPaneView, setLeftPaneView] = useState<LeftPaneView>(
    LEFT_PANE_VIEWS.layers,
  );
  useEditShortcuts();

  const isFrozen = EditorState.isFileInvalid(state);

  return (
    <EditorLayout>
      <EditorLayout.LeftPane isFrozen={isFrozen}>
        <LeftPane
          view={leftPaneView}
          onSelectView={setLeftPaneView}
          state={state}
          node={node}
          token={token}
        />
      </EditorLayout.LeftPane>
      <EditorLayout.CenterPane>
        <ArtboardCanvas
          state={state}
          canvasView={canvasView}
          onSelect={node.selectAt}
          onMoveNode={node.move}
          onResize={node.resize}
          onEditProp={node.editProp}
        />
        <CanvasDockContent dock={canvasDock(state)} node={node} />
      </EditorLayout.CenterPane>
      <EditorLayout.RightPane isFrozen={isFrozen}>
        <RightPaneContent
          view={leftPaneView}
          state={state}
          node={node}
          token={token}
          /*
           * `Go to source component` の行き先は `Assets` パネル。部品定義は
           * キャンバスに描かれず選択もできない（`ComponentList` の線引き）ので、
           * 「元の部品を示す」= パレットのその行を見せることになる。行の強調は
           * インスタンスを選んだ時点で出ているため、ここは行き先を変えるだけ。
           */
          onGoToSource={() => setLeftPaneView(LEFT_PANE_VIEWS.assets)}
        />
      </EditorLayout.RightPane>
    </EditorLayout>
  );
}

/**
 * 開いているファイルとの同期（自動保存と外部変更の取り込み）を張り、3 ペインと
 * その失敗の表示を組み立てる（docs/05-architecture.md「保存モデル: 自動保存」
 * 「外部編集の検知」）。
 *
 * 器（Provider）の中に置くのは、同期の相手が「今表示しているドキュメント」であり、
 * それを読めるのが Provider の内側だけだから。
 */
function EditorBody({
  ipc,
  opened,
}: Readonly<{ ipc: DocumentIpc; opened: OpenedDocument }>) {
  const { state, dispatch } = useEditor();
  const path = opened.path;
  /*
   * ズーム / パンをここで持つのは、倍率の操作（上部バー）と操作の対象（キャンバス）が
   * 兄弟として並ぶため。パンのたびに 3 ペインまで再レンダーが広がるが、Context へ
   * 移しても state の位置は変わらないので同じ（#134）。
   */
  const canvasView = useCanvasView();

  const saveState = useAutoSave({
    ipc,
    path,
    document: EditorState.document(state),
  });
  const watchFailure = useDocumentReload({
    ipc,
    path,
    onReload: (reload) => dispatch({ type: "reload_document", reload }),
  });

  const isFileInvalid = EditorState.isFileInvalid(state);
  const tone = isFileInvalid
    ? EDITOR_TOP_BAR_TONES.error
    : EDITOR_TOP_BAR_TONES.normal;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <EditorTopBar tone={tone}>
        <EditorTopBar.Breadcrumb opened={opened} />
        {/*
          ファイルが不正な間は保存状態を出さない。映っているのは最後に正常だった
          表示で、それがファイルに載っているかどうかは今の関心ではないため（#135）。
        */}
        {isFileInvalid ? (
          <EditorTopBar.FileInvalidBadge errors={state.fileErrors} />
        ) : (
          <EditorTopBar.SaveBadge state={saveState} />
        )}
        {/*
          Why not: UI 案の Error 画面は倍率の枠を `showing last valid render · 4s ago`
          へ置き換えて倍率を落としているが、倍率は表示の操作でファイルにも編集履歴にも
          触れないので凍結中も残す（最後に正常だった表示を確かめるのに使える）。
          相対時刻は #183 でこの左隣に入る。
        */}
        <EditorTopBar.Zoom
          view={canvasView.view}
          onZoomIn={canvasView.zoomIn}
          onZoomOut={canvasView.zoomOut}
          onReset={canvasView.reset}
        />
      </EditorTopBar>
      <DocumentSyncFailureList
        autoSave={DocumentSaveState.failure(saveState)}
        watch={watchFailure}
      />
      <EditorPanes canvasView={canvasView} />
    </div>
  );
}

/**
 * 開いているドキュメントの編集画面（docs/06-ui.md「画面構成」）。
 *
 * 状態の器（Provider）と中身の組み立てだけを持つ。
 */
export function OpenedDocumentEditor({
  ipc,
  opened,
}: Readonly<{ ipc: DocumentIpc; opened: OpenedDocument }>) {
  return (
    <EditorProvider initialDocument={opened.document}>
      <EditorBody ipc={ipc} opened={opened} />
    </EditorProvider>
  );
}

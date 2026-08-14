import { type ReactElement, type ReactNode, useState } from "react";
import { ArtboardCanvas } from "@/features/editor/components/artboard-canvas";
import {
  DocumentErrorList,
  DocumentErrorOrigins,
} from "@/features/editor/components/document-error-list";
import { DocumentSyncFailureList } from "@/features/editor/components/document-sync-failure-list";
import { EditorLayout } from "@/features/editor/components/editor-layout";
import {
  EditorProvider,
  useEditor,
} from "@/features/editor/components/editor-provider";
import { EditorTopBar } from "@/features/editor/components/editor-top-bar";
import { LeftPane } from "@/features/editor/components/left-pane";
import {
  LEFT_PANE_VIEWS,
  type LeftPaneView,
} from "@/features/editor/components/left-pane-rail";
import { NodeInsertToolbar } from "@/features/editor/components/node-insert-toolbar";
import { PropertyPanel } from "@/features/editor/components/property-panel";
import { TokenCanvasLegend } from "@/features/editor/components/token-canvas-legend";
import { TokenEditor } from "@/features/editor/components/token-editor";
import type { DocumentError } from "@/features/editor/domains/document-error";
import { DocumentSaveState } from "@/features/editor/domains/document-save-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { FileValidity } from "@/features/editor/domains/file-validity";
import type { OpenedDocument } from "@/features/editor/domains/opened-document";
import { useAutoSave } from "@/features/editor/hooks/use-auto-save";
import {
  type CanvasViewControl,
  useCanvasView,
} from "@/features/editor/hooks/use-canvas-view";
import { useDocumentReload } from "@/features/editor/hooks/use-document-reload";
import { useEditShortcuts } from "@/features/editor/hooks/use-edit-shortcuts";
import { useElapsed } from "@/features/editor/hooks/use-elapsed";
import {
  type FileRevertControl,
  useFileRevert,
} from "@/features/editor/hooks/use-file-revert";
import {
  type NodeActions,
  useNodeActions,
} from "@/features/editor/hooks/use-node-actions";
import {
  type TokenActions,
  useTokenActions,
} from "@/features/editor/hooks/use-token-actions";
import type { Clock } from "@/libs/clock";
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
      return (
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
  const fileValidity = state.fileValidity;
  if (fileValidity.kind === "invalid") {
    return { kind: "file-invalid", errors: fileValidity.errors };
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
  state,
  node,
  onReveal,
  fileRevert,
}: Readonly<{
  dock: CanvasDock;
  state: EditorState;
  node: NodeActions;
  onReveal: (nodeName: string) => void;
  fileRevert: FileRevertControl;
}>): ReactElement {
  switch (dock.kind) {
    case "file-invalid":
      return (
        <CanvasDockStack>
          <DocumentErrorList
            errors={dock.errors}
            origin={DocumentErrorOrigins.OpenedFile}
            onReveal={onReveal}
            onRevertFile={fileRevert.revert}
            isReverting={DocumentSaveState.isSaving(fileRevert.saveState)}
          />
          {/*
            ファイルが不正な間もトークンは選べるので破線は出る。凡例をここへ出さないと、
            破線だけが出て何を指しているか読めない状態が画面に残る。
          */}
          <TokenCanvasLegend state={state} />
        </CanvasDockStack>
      );
    case "editable":
      return (
        <CanvasDockStack>
          <DocumentErrorList
            errors={dock.errors}
            origin={DocumentErrorOrigins.Document}
            onReveal={onReveal}
          />
          <TokenCanvasLegend state={state} />
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
  fileRevert,
}: Readonly<{
  canvasView: CanvasViewControl;
  fileRevert: FileRevertControl;
}>) {
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

  return (
    <EditorLayout>
      <EditorLayout.LeftPane>
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
        <CanvasDockContent
          dock={canvasDock(state)}
          state={state}
          node={node}
          /*
           * 選ぶだけでなく行き先も Layers へ戻す。トークンを消して不正を作った直後は
           * 左ペインが Tokens なので、選んでもツリーにもプロパティにも出ない
           * （`Go to source component` が Assets へ移すのと同じ形）。
           */
          onReveal={(nodeName) => {
            node.reveal(nodeName);
            setLeftPaneView(LEFT_PANE_VIEWS.layers);
          }}
          fileRevert={fileRevert}
        />
      </EditorLayout.CenterPane>
      <EditorLayout.RightPane>
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
  clock,
  ipc,
  opened,
}: Readonly<{ clock: Clock; ipc: DocumentIpc; opened: OpenedDocument }>) {
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
    // 時計を読むのはハンドラの中。reducer は純粋関数なのでその中では読めない。
    onReload: (reload) =>
      dispatch({ type: "reload_document", reload, at: clock.now() }),
  });
  const elapsed = useElapsed(clock, FileValidity.since(state.fileValidity));
  const fileRevert = useFileRevert({
    ipc,
    path,
    document: EditorState.document(state),
    onReverted: () => dispatch({ type: "revert_file" }),
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <EditorTopBar>
        <EditorTopBar.Breadcrumb opened={opened} />
        <EditorTopBar.SaveBadge state={saveState} />
        <EditorTopBar.Zoom
          view={canvasView.view}
          onZoomIn={canvasView.zoomIn}
          onZoomOut={canvasView.zoomOut}
          onReset={canvasView.reset}
        />
        {elapsed.some ? (
          <EditorTopBar.LastValidRender elapsed={elapsed.value} />
        ) : null}
      </EditorTopBar>
      <DocumentSyncFailureList
        autoSave={DocumentSaveState.failure(saveState)}
        watch={watchFailure}
        revert={DocumentSaveState.failure(fileRevert.saveState)}
      />
      <EditorPanes canvasView={canvasView} fileRevert={fileRevert} />
    </div>
  );
}

/**
 * 開いているドキュメントの編集画面（docs/06-ui.md「画面構成」）。
 *
 * 状態の器（Provider）と中身の組み立てだけを持つ。
 */
export function OpenedDocumentEditor({
  clock,
  ipc,
  opened,
}: Readonly<{ clock: Clock; ipc: DocumentIpc; opened: OpenedDocument }>) {
  return (
    <EditorProvider initialDocument={opened.document}>
      <EditorBody clock={clock} ipc={ipc} opened={opened} />
    </EditorProvider>
  );
}

import { type ReactElement, type ReactNode, useMemo, useState } from "react";
import { PaneBody } from "@/components/pane-body";
import { PaneHeading } from "@/components/pane-heading";
import { DesignDocument } from "@/domains/dcmp/design-document";
import type { DocumentError } from "@/domains/session/document-error";
import { DocumentSaveState } from "@/domains/session/document-save-state";
import { DocumentSelection } from "@/domains/session/document-selection";
import { FileValidity } from "@/domains/session/file-validity";
import type { NodeTemplate } from "@/domains/session/node-template";
import type { OpenedDocument } from "@/domains/session/opened-document";
import { SelectionDigs } from "@/domains/session/selection-dig";
import type { TokenSelection } from "@/domains/session/token-selection";
import {
  ArtboardCanvas,
  CanvasToolbar,
  type CanvasViewControl,
  useCanvasView,
  useNodeDrag,
} from "@/features/canvas";
import {
  DocumentSyncFailureList,
  type FileRevertControl,
  useAutoSave,
  useDocumentReload,
  useElapsed,
  useFileRevert,
} from "@/features/document-sync";
import {
  DocumentErrorList,
  DocumentErrorOrigins,
} from "@/features/editor/components/document-error-list";
import { EditorContextMenu } from "@/features/editor/components/editor-context-menu";
import { EditorLayout } from "@/features/editor/components/editor-layout";
import {
  EditorProvider,
  useEditor,
} from "@/features/editor/components/editor-provider";
import {
  EditorTopBar,
  EditorTopBarTones,
} from "@/features/editor/components/editor-top-bar";
import {
  EditMenuTarget,
  EditMenuTargets,
} from "@/features/editor/domains/edit-menu";
import { EditorState } from "@/features/editor/domains/editor-state";
import {
  type ArtboardActions,
  useArtboardActions,
} from "@/features/editor/hooks/use-artboard-actions";
import { useEditShortcuts } from "@/features/editor/hooks/use-edit-shortcuts";
import { useFitDocumentShortcut } from "@/features/editor/hooks/use-fit-document-shortcut";
import { useFitSelectionShortcut } from "@/features/editor/hooks/use-fit-selection-shortcut";
import {
  type NodeActions,
  useNodeActions,
} from "@/features/editor/hooks/use-node-actions";
import {
  type TokenActions,
  useTokenActions,
} from "@/features/editor/hooks/use-token-actions";
import type { OpenedContextMenu } from "@/features/editor/types/OpenedContextMenu";
import { PropertyPanel } from "@/features/inspector";
import { LeftPane, type LeftPaneView, LeftPaneViews } from "@/features/sidebar";
import { TokenDashedNodes, TokenEditor } from "@/features/tokens";
import type { Clock } from "@/libs/clock";
import type { DocumentIpc } from "@/libs/document-ipc";
import { Option } from "@/utils/Option";

/**
 * 右ペインの帯と本文に出すもの。器（`PaneHeading` / `PaneBody`）は呼び出し側が
 * 着せるので、ここが持つのは中身だけ。
 */
type RightPaneParts = Readonly<{ title: ReactNode; body: ReactElement }>;

/**
 * 行き先ごとの右ペインの中身。
 *
 * @returns Tokens ならトークンの編集欄、Layers / Assets ならプロパティパネル
 */
function rightPaneParts({
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
}>): RightPaneParts {
  const isFrozen = EditorState.isFileInvalid(state);
  const documentSelection = EditorState.documentSelection(state);
  const inspector: RightPaneParts = {
    title: <PropertyPanel.Title selection={documentSelection} />,
    body: (
      <PropertyPanel.Body
        selection={documentSelection}
        isFrozen={isFrozen}
        onEditProp={node.editProp}
        onClearSelection={node.clearSelection}
        instance={{
          goToSource: onGoToSource,
          selectAllInstances: node.selectAllInstances,
          detach: node.detachInstance,
        }}
      />
    ),
  };

  /*
   * 凍結は行き先より先に見る。ファイルが不正な間はトークンも編集できないので、
   * Tokens を開いたまま壊れたときに編集欄が残らないようにする。
   * プロパティパネルが凍結時の中身（「選択は凍結中」）を持つ。
   */
  if (isFrozen) {
    return inspector;
  }

  const tokenSelection = EditorState.tokenSelection(state);

  switch (view) {
    case LeftPaneViews.Tokens:
      return {
        title: <TokenEditor.Title selection={tokenSelection} />,
        body: (
          <TokenEditor.Body
            selection={tokenSelection}
            onSetTokenValue={token.setValue}
            onRenameToken={token.rename}
            onRemoveToken={token.remove}
          />
        ),
      };
    case LeftPaneViews.Layers:
    case LeftPaneViews.Assets:
      return inspector;
  }
}

/** キャンバス下端に出すもの。ファイルが不正な状態と、編集を続けられる状態の 2 つ。 */
type CanvasDock =
  | Readonly<{ kind: "file-invalid"; errors: readonly DocumentError[] }>
  | Readonly<{ kind: "editable"; errors: readonly DocumentError[] }>;

/**
 * 今どちらの状態かと、そこで出すエラーを決める。
 *
 * ファイルが不正な間は表示自体がファイルと食い違っているので、そちらの一覧だけを出す。2
 * つの一覧を並べると、外部エディタでしか直せないファイルの一覧が、アプリ内で直せるドキ
 * ュメントの一覧の場所を奪う。
 *
 * @param state エラーの出どころになるエディタの状態
 * @returns ファイルが不正ならそのエラー、そうでなければ編集で作ったエラー
 */
function canvasDock(state: EditorState): CanvasDock {
  const fileValidity = state.fileValidity;
  if (FileValidity.isInvalid(fileValidity)) {
    return { kind: "file-invalid", errors: fileValidity.errors };
  }
  return { kind: "editable", errors: EditorState.documentErrors(state) };
}

/**
 * 下端に積む器。エラー一覧とキャンバスのツールバーが同じ場所を取り合うため、順序と間隔
 * はここが持つ（各部品が浮くと重なる）。帯はキャンバスの幅いっぱいに広がるので、ポイン
 * タを受け取るのは積んだものだけにして、透明な余白はキャンバスへ通す。
 *
 * **この位置指定を落としてもテストは落ちない** — happy-dom はレイアウトを解決しない。気づ
 * く手段は `OpenedDocumentEditor` のストーリーの視覚差分だけで、それが成り立つのは**ストー
 * リーが高さの決まった器に入っているとき**に限る（器を外すと撮影範囲の外へ出る）。
 *
 * 当たり判定のほうは、テストが見られるのはクラスの綴りまで。happy-dom は Tailwind を読ま
 * ず（`user-event` が見るのは計算済みの `pointer-events`）、色も変わらないので視覚差分に
 * も映らない。実際の当たり先はブラウザで測るしかない。
 *
 * 受け取り直す指定を部品ごとではなく直下の子すべてに掛けるのは、あとから積む部品が何も
 * 書かずに受け取れるようにするため。**子が全面に広がる透明なラッパーになると症状は黙って
 * 戻る**。ラッパーを 1 枚挟んで配る形は採らない（空のラッパーが `gap-3` を食い、`self-start`
 * も効かなくなる）。
 *
 * ドックだけのストーリーを立てないのは、積み方そのものがここの判断で、ストーリー側へ写
 * すと本物の積み方が壊れても気づけないため。
 *
 * @returns 子を縦に積み、キャンバスの下端に寄せる器
 */
function CanvasDockStack({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div
      data-testid="canvas-dock-stack"
      className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-3 px-4 [&>*]:pointer-events-auto"
    >
      {children}
    </div>
  );
}

/** 下端に並べるものを決めるのに要るもの。 */
type CanvasDockContentProps = Readonly<{
  dock: CanvasDock;
  tokenSelection: TokenSelection;
  node: NodeActions;
  artboard: ArtboardActions;
  dragged: Option<NodeTemplate>;
  onReveal: (nodeName: string) => void;
  fileRevert: FileRevertControl;
}>;

/**
 * 下端の出し分け。
 *
 * 編集を続けたまま直せる。一覧は 0 件なら何も出さない。
 *
 * @returns ファイルが不正ならエラー一覧と破線の帯、そうでなければそれにキャンバスの
 *   ツールバーを足したもの
 */
function canvasDockParts({
  dock,
  tokenSelection,
  node,
  artboard,
  dragged,
  onReveal,
  fileRevert,
}: CanvasDockContentProps): ReactElement {
  switch (dock.kind) {
    case "file-invalid":
      return (
        <>
          <DocumentErrorList
            errors={dock.errors}
            origin={DocumentErrorOrigins.OpenedFile}
            onReveal={onReveal}
            onRevertFile={fileRevert.revert}
            isReverting={DocumentSaveState.isSaving(fileRevert.saveState)}
          />
          {/*
            ファイルが不正な間は左ペインが凍るので選び直しはできないが、
            壊れる前に選んでいたトークンの破線はキャンバスに残る。ここへ出さないと、
            破線だけが出て何を指しているか読めない状態が画面に残る。
          */}
          <TokenDashedNodes selection={tokenSelection} onReveal={onReveal} />
        </>
      );
    case "editable":
      return (
        <>
          <DocumentErrorList
            errors={dock.errors}
            origin={DocumentErrorOrigins.Document}
            onReveal={onReveal}
          />
          <TokenDashedNodes selection={tokenSelection} onReveal={onReveal} />
          <CanvasToolbar
            isInsertEnabled={node.isInsertEnabled}
            dragged={dragged}
            onAddArtboard={artboard.add}
            onInsert={node.insert}
          />
        </>
      );
  }
}

/**
 * 下端に積んだもの一式。
 *
 * 器を出し分けの外に置くのは、どちらの状態でも積み方（順序・間隔・当たり判定）が同じで、
 * 枝ごとに書くと片方だけ器を失っても誰も気づかないため。
 *
 * @param props 中身の出し分けへそのまま渡すもの
 * @returns 状態に応じた中身を積んだ、キャンバス下端の器
 */
function CanvasDockContent(props: CanvasDockContentProps): ReactElement {
  return <CanvasDockStack>{canvasDockParts(props)}</CanvasDockStack>;
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
  const artboard = useArtboardActions();
  /**
   * 左ペインが何を映しているか（UI 案 docs/Design Composer.html のアイコンレール）。右ペイ
   * ンに出すのもこれで決まる（Tokens ならトークン編集、それ以外はプロパティ）。
   *
   * 編集とは連動しない表示だけの状態なので `EditorState` には持たせず、両ペインを組むここ
   * に置く。
   */
  const [leftPaneView, setLeftPaneView] = useState<LeftPaneView>(
    LeftPaneViews.Layers,
  );
  /**
   * 開いているコンテキストメニュー。左ペインの行き先と同じく表示だけの状態なので
   * `EditorState` には持たせない（開閉が undo / redo と自動保存に載る意味が無い）。
   */
  const [contextMenu, setContextMenu] = useState<Option<OpenedContextMenu>>(
    Option.none,
  );
  useEditShortcuts();

  /*
   * 掴む場所（左ペインのパレット）と落とす場所（キャンバス）が別のペインにあるので、
   * ドラッグの状態は両方の親であるここが持つ。運んでいるものが既存ノードなら移動、
   * パレットの雛形なら落とした先への挿入になる。
   */
  const nodeDrag = useNodeDrag({
    document: EditorState.document(state),
    view: canvasView.view,
    onMove: node.move,
    onReposition: node.reposition,
    onInsertAt: node.insertAt,
  });
  /*
   * ドキュメントと選択の対・トークンの対を、ここで 1 つずつだけ作る。
   * 受け取る側（キャンバスの破線、下端の帯）はこれを覚えて数え直しを避けるので、
   * レンダーのたびに作り直すと覚えたものが毎回捨てられる
   * （パン / ズームでこのツリー全体が再レンダーされる）。
   */
  const documentSelection = useMemo(
    () => EditorState.documentSelection(state),
    [state],
  );
  const tokenSelection = useMemo(
    () => EditorState.tokenSelection(state),
    [state],
  );

  /*
   * 収めるズームの 2 本は `useEditShortcuts` へは寄せない。あちらが張るのはドキュメント
   * と編集履歴に触れる操作で、`useEditor()` の dispatch しか持たない。ズームは表示だけ
   * の操作で、収める先を知っているのは `canvasView`（ここの props）。
   *
   * 上部バーの拡大 / 縮小の隣にボタンを置かない。UI 案（docs/Design Composer.html）に
   * `zoom` / `fit` / 「ズーム」の綴りは 1 つも無く、倍率の操作そのものが描かれていない
   * ため（`useEditShortcuts` と同じ線引き）。
   */
  useFitDocumentShortcut(() =>
    canvasView.fitTo(
      DesignDocument.collectArtboardNames(EditorState.document(state)),
    ),
  );
  useFitSelectionShortcut(() =>
    canvasView.fitTo(DocumentSelection.names(documentSelection)),
  );

  const isFrozen = EditorState.isFileInvalid(state);
  const rightPane = rightPaneParts({
    view: leftPaneView,
    state,
    node,
    token,
    /*
     * `Go to source component` の行き先は `Assets` パネル。部品定義は
     * キャンバスに描かれず選択もできない（`ComponentList` の線引き）ので、
     * 「元の部品を示す」= パレットのその行を見せることになる。行の強調は
     * インスタンスを選んだ時点で出ているため、ここは行き先を変えるだけ。
     */
    onGoToSource: () => setLeftPaneView(LeftPaneViews.Assets),
  });

  return (
    <>
      <EditorLayout dragHandlers={nodeDrag.dragHandlers}>
        <EditorLayout.LeftPane isFrozen={isFrozen}>
          <LeftPane
            view={leftPaneView}
            onSelectView={setLeftPaneView}
            selection={documentSelection}
            renaming={EditorState.renamingName(state)}
            tokenSelection={tokenSelection}
            isFrozen={isFrozen}
            artboard={artboard}
            node={node}
            rename={{
              startAt: node.startRenamingAt,
              commit: node.rename,
              finish: node.finishRenaming,
              cancel: node.cancelRenaming,
            }}
            token={token}
            grab={{
              dragged: nodeDrag.carriedTemplate,
              onGrab: nodeDrag.grabTemplate,
            }}
          />
        </EditorLayout.LeftPane>
        <EditorLayout.CenterPane>
          <ArtboardCanvas
            selection={documentSelection}
            tokenSelection={tokenSelection}
            isFrozen={isFrozen}
            canvasView={canvasView}
            nodeDrag={nodeDrag}
            onSelect={node.selectAt}
            onSelectInRange={node.selectNodes}
            onResize={node.resize}
            onEditProp={node.editProp}
            onRepositionArtboard={node.repositionArtboard}
            onOpenContextMenu={(names, at) => {
              const target = EditMenuTarget.fromNames(names);
              // 空き領域では選択に手を付けない（docs/06-ui.md「コンテキストメニュー」）
              if (target !== EditMenuTargets.EmptyArea) {
                node.selectAt(names, SelectionDigs.NoDeeper);
              }
              setContextMenu(Option.some({ at, target }));
            }}
          />
          <CanvasDockContent
            dock={canvasDock(state)}
            tokenSelection={tokenSelection}
            node={node}
            artboard={artboard}
            dragged={nodeDrag.carriedTemplate}
            /*
             * 選ぶだけでなく行き先も Layers へ戻す。エラー行からも帯からも、
             * Tokens を見たまま飛ぶことがあり、そのときは選んでもツリーにも
             * プロパティにも出ない（`Go to source component` が Assets へ移すのと同じ形）。
             */
            onReveal={(nodeName) => {
              node.reveal(nodeName);
              setLeftPaneView(LeftPaneViews.Layers);
            }}
            fileRevert={fileRevert}
          />
        </EditorLayout.CenterPane>
        <EditorLayout.RightPane isFrozen={isFrozen}>
          {/*
          帯と本文の器はどちらの行き先でもここで着せる。どのペインに何を着せるかは
          3 ペインの組み立ての判断で、中身を持つ feature は持たない
          （`features/inspector/index.ts` / `features/tokens/index.ts` の doc）。

          選んでいなくても帯は残すので、中身が空でも `PaneHeading` ごと外さない。
          外すと選択のたびに本文の位置が帯のぶん動く。
        */}
          <PaneHeading>{rightPane.title}</PaneHeading>
          <PaneBody>{rightPane.body}</PaneBody>
        </EditorLayout.RightPane>
      </EditorLayout>
      {/*
        メニューは 3 ペインの器の**外**に置く。中に置くと、凍結中に付く
        `filter: saturate(0.4)`（`EditorLayout`）がそのペインを `position: fixed` の
        基準にしてしまい、窓の座標で置けなくなる。
      */}
      {contextMenu.some ? (
        <EditorContextMenu
          opened={contextMenu.value}
          onClose={() => setContextMenu(Option.none)}
        />
      ) : null}
    </>
  );
}

/**
 * 開いているファイルとの同期（自動保存と外部変更の取り込み）を張り、3 ペインと
 * その失敗の表示を組み立てる（docs/05-architecture.md「保存モデル: 自動保存」
 * 「外部編集の検知」）。
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
   * 移しても state の位置は変わらないので同じ。
   */
  const canvasView = useCanvasView();

  const saveState = useAutoSave({
    ipc,
    path,
    document: EditorState.document(state),
    fileValidity: state.fileValidity,
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

  /*
   * 直和のまま持つのは、エラー一式を出す側が「不正である」ことと同時に受け取れるように
   * するため（`isFileInvalid` で分岐してから別に読むと、0 件のまま不正と名乗る
   * 組み合わせが書ける）。
   */
  const fileValidity = state.fileValidity;
  const tone = FileValidity.isInvalid(fileValidity)
    ? EditorTopBarTones.Error
    : EditorTopBarTones.Normal;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <EditorTopBar tone={tone}>
        <EditorTopBar.Breadcrumb opened={opened} />
        {/*
          ファイルが不正な間は保存状態を出さない。映っているのは最後に正常だった
          表示で、それがファイルに載っているかどうかは今の関心ではないため。
        */}
        {FileValidity.isInvalid(fileValidity) ? (
          <EditorTopBar.FileInvalidBadge errors={fileValidity.errors} />
        ) : (
          <EditorTopBar.SaveBadge state={saveState} />
        )}
        {/*
          UI 案の Error 画面は倍率の枠を古さの行へ置き換えて倍率を落として
          いるが、倍率は表示の操作でファイルにも編集履歴にも触れないので凍結中も残す
          （最後に正常だった表示を確かめるのに使える）。古さの行は右隣に並ぶ。
        */}
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

import { useMemo, useState } from "react";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSaveState } from "@/domains/session/document-save-state";
import { DocumentSelection } from "@/domains/session/document-selection";
import { EditContinuities } from "@/domains/session/edit-continuity";
import { FileValidity } from "@/domains/session/file-validity";
import type { OpenedDocument } from "@/domains/session/opened-document";
import { SelectionDigs } from "@/domains/session/selection-dig";
import { CanvasDockContent } from "@/features/editor/components/canvas-dock";
import { EditorContextMenu } from "@/features/editor/components/editor-context-menu";
import { EditorLayout } from "@/features/editor/components/editor-layout";
import { EditorLeftPane } from "@/features/editor/components/editor-left-pane";
import {
  EditorProvider,
  useEditor,
} from "@/features/editor/components/editor-provider";
import { EditorRightPane } from "@/features/editor/components/editor-right-pane";
import {
  EditorTopBar,
  EditorTopBarTones,
} from "@/features/editor/components/editor-top-bar";
import {
  EditMenuTarget,
  EditMenuTargets,
} from "@/features/editor/domains/edit-menu";
import { EditorState } from "@/features/editor/domains/editor-state";
import type { AssetGrab } from "@/features/editor/features/assets";
import {
  ArtboardCanvas,
  type CanvasViewControl,
  useCanvasView,
  useNodeDrag,
} from "@/features/editor/features/canvas";
import {
  DocumentSyncFailureList,
  type FileRevertControl,
  useAutoSave,
  useDocumentReload,
  useElapsed,
  useFileRevert,
} from "@/features/editor/features/document-sync";
import {
  type LeftPaneView,
  LeftPaneViews,
} from "@/features/editor/features/sidebar";
import { useArtboardActions } from "@/features/editor/hooks/use-artboard-actions";
import { useEditShortcuts } from "@/features/editor/hooks/use-edit-shortcuts";
import { useFitDocumentShortcut } from "@/features/editor/hooks/use-fit-document-shortcut";
import { useFitSelectionShortcut } from "@/features/editor/hooks/use-fit-selection-shortcut";
import { useNodeActions } from "@/features/editor/hooks/use-node-actions";
import { useTokenActions } from "@/features/editor/hooks/use-token-actions";
import type { OpenedContextMenu } from "@/features/editor/types/OpenedContextMenu";
import type { Clock } from "@/libs/clock";
import type { DocumentIpc } from "@/libs/document-ipc";
import { Option } from "@/utils/Option";

/**
 * Provider から状態を読んで各ペインへ配る。
 * 読み出しをここ 1 箇所に集めることで、ペイン（`EditorLeftPane` / `CanvasDockContent` /
 * `EditorRightPane`）は props だけで描ける（個別に単体描画・テストできる）。
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
  /* 掴む側（パレット）と落とす側（キャンバス）の対。`features/assets` が持つ契約。 */
  const assetGrab: AssetGrab = {
    dragged: nodeDrag.carriedTemplate,
    onGrab: nodeDrag.grabTemplate,
  };

  return (
    <>
      <EditorLayout dragHandlers={nodeDrag.dragHandlers}>
        <EditorLayout.LeftPane isFrozen={isFrozen}>
          <EditorLeftPane
            view={leftPaneView}
            onSelectView={setLeftPaneView}
            selection={documentSelection}
            tokenSelection={tokenSelection}
            renaming={EditorState.renamingName(state)}
            isFrozen={isFrozen}
            node={node}
            artboard={artboard}
            token={token}
            grab={assetGrab}
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
            /* インライン編集は確定の 1 件だけを送るので、常に別のまとまり。 */
            onEditProp={(edit) =>
              node.editProp(edit, EditContinuities.Separate)
            }
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
            state={state}
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
          <EditorRightPane
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
            onGoToSource={() => setLeftPaneView(LeftPaneViews.Assets)}
          />
        </EditorLayout.RightPane>
      </EditorLayout>
      {/*
        メニューは 3 ペインの器の**外**に置く。中に置くと、凍結中に付く
        `filter: saturate(0.4)`（`EditorLayout`）がそのペインを `position: fixed` の
        基準にしてしまい、窓の座標で置けなくなる。
      */}
      {Option.isSome(contextMenu) ? (
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
        {Option.isSome(elapsed) ? (
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

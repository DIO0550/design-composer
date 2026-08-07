import { useState } from "react";
import type { AxisLength } from "@/domains/axis-length";
import type { ChildPosition } from "@/domains/child-position";
import type { PropEdit } from "@/domains/node";
import type { TokenRef, TokenValue } from "@/domains/token";
import { ArtboardCanvas } from "@/features/editor/components/artboard-canvas";
import { ComponentList } from "@/features/editor/components/component-list";
import { DocumentErrorList } from "@/features/editor/components/document-error-list";
import { DocumentSyncFailureList } from "@/features/editor/components/document-sync-failure-list";
import { DocumentTree } from "@/features/editor/components/document-tree";
import { EditorLayout } from "@/features/editor/components/editor-layout";
import {
  EditorProvider,
  useEditor,
} from "@/features/editor/components/editor-provider";
import {
  LEFT_PANE_TABS,
  type LeftPaneTab,
  LeftPaneTabs,
} from "@/features/editor/components/left-pane-tabs";
import { NodeEditToolbar } from "@/features/editor/components/node-edit-toolbar";
import { PropertyPanel } from "@/features/editor/components/property-panel";
import { TokenEditor } from "@/features/editor/components/token-editor";
import { TokenList } from "@/features/editor/components/token-list";
import { EditorState } from "@/features/editor/domains/editor-state";
import type { NodeTemplate } from "@/features/editor/domains/node-template";
import type { OpenedDocument } from "@/features/editor/domains/opened-document";
import type { TokenTemplate } from "@/features/editor/domains/token-template";
import { useAutoSave } from "@/features/editor/hooks/use-auto-save";
import { useCopyShortcut } from "@/features/editor/hooks/use-copy-shortcut";
import { useDeleteShortcut } from "@/features/editor/hooks/use-delete-shortcut";
import { useDocumentReload } from "@/features/editor/hooks/use-document-reload";
import { usePasteShortcut } from "@/features/editor/hooks/use-paste-shortcut";
import { useRedoShortcut } from "@/features/editor/hooks/use-redo-shortcut";
import { useUndoShortcut } from "@/features/editor/hooks/use-undo-shortcut";
import type { DocumentIpc } from "@/libs/document-ipc";

/**
 * Provider から状態を読んで各ペインへ配る。
 * 読み出しをここ 1 箇所に集めることで、ペインは props だけで描ける
 * （個別に単体描画・テストできる）。
 */
function EditorPanes() {
  const { state, dispatch } = useEditor();
  const selectNode = (name: string) => dispatch({ type: "select", name });
  /**
   * キャンバスは押された位置から外へ辿った名前を渡す。どれを選ぶかは状態側の判断
   * （選択できる最も内側のもの / EditorState.selectInnermost）。
   */
  const selectNodeAt = (names: readonly string[]) =>
    dispatch({ type: "select_innermost", names });
  const reorderNode = (from: ChildPosition, toIndex: number) =>
    dispatch({ type: "reorder_node", from, toIndex });
  /** キャンバスのドラッグはツリー内の移動（docs/06-ui.md「キャンバス直接操作」）。 */
  const moveNode = (name: string, to: ChildPosition) =>
    dispatch({ type: "move_node", name, to });
  /** リサイズハンドルのドラッグは選択中のものの大きさの変更（docs/06-ui.md）。 */
  const resize = (size: AxisLength) => dispatch({ type: "resize", size });
  /**
   * prop の編集はプロパティパネルとキャンバスのインライン編集の両方から届く
   * （どちらも選択中のものへの編集なので同じアクションで受ける）。
   */
  const editProp = (edit: PropEdit) =>
    dispatch({ type: "apply_prop_edit", edit });
  /**
   * 挿入と削除は選択中のものを起点にするため、押せるかどうかも選択から決まる
   * （docs/06-ui.md「編集操作の一覧」）。
   */
  const insertNode = (template: NodeTemplate) =>
    dispatch({ type: "insert_node", template });
  const removeNode = () => dispatch({ type: "remove_node" });
  /**
   * コピー & ペーストはキーボードだけの操作（docs/06-ui.md「編集操作の一覧」/ #40）。
   *
   * ボタンを置かないのは、UI 案（docs/Design Composer.html）の左ペインが
   * Artboards の `+` しか持たず、編集操作をボタン列で並べていないため。
   * 対象が無いときは状態側が「その操作は存在しない」と答えるので、
   * 押せるかどうかをここで判定する必要も無い。
   */
  const copyNode = () => dispatch({ type: "copy_node" });
  const pasteNode = () => dispatch({ type: "paste_node" });
  /**
   * undo / redo もキーボードだけの操作（docs/06-ui.md「編集操作の一覧」/ #41）。
   * UI 案（docs/Design Composer.html）が undo / redo の UI を描いていないため、
   * コピー & ペーストと同じ扱いにしている。
   */
  const undo = () => dispatch({ type: "undo" });
  const redo = () => dispatch({ type: "redo" });
  const isInsertEnabled = EditorState.insertPosition(state).some;
  const isRemoveEnabled = EditorState.removableName(state).some;
  /**
   * トークンの編集（docs/06-ui.md「編集操作の一覧」の tokens 編集 / #42）。
   * 対象は選択中のトークンなので、値・名前・削除はどれも対象を受け取らない。
   */
  const selectToken = (ref: TokenRef) =>
    dispatch({ type: "select_token", ref });
  const addToken = (template: TokenTemplate) =>
    dispatch({ type: "add_token", template });
  const setTokenValue = (value: TokenValue) =>
    dispatch({ type: "set_token_value", value });
  const renameToken = (name: string) =>
    dispatch({ type: "rename_token", name });
  const removeToken = () => dispatch({ type: "remove_token" });

  /**
   * 左ペインが何を映しているか（UI 案 docs/Design Composer.html のタブ）。
   * 右ペインに出すのもこれで決まる（Layers ならプロパティ、Tokens ならトークン編集）。
   * 編集とは連動しない表示だけの状態なので `EditorState` には持たせない。
   */
  const [leftPaneTab, setLeftPaneTab] = useState<LeftPaneTab>(
    LEFT_PANE_TABS.layers,
  );
  const isTokensTab = leftPaneTab === LEFT_PANE_TABS.tokens;

  /** 削除はボタンとキーボードの両方から届く（どちらも選択中のものを消す）。 */
  useDeleteShortcut(removeNode);
  useCopyShortcut(copyNode);
  usePasteShortcut(pasteNode);
  useUndoShortcut(undo);
  useRedoShortcut(redo);

  return (
    <EditorLayout>
      <EditorLayout.LeftPane>
        <LeftPaneTabs current={leftPaneTab} onSelect={setLeftPaneTab} />
        {isTokensTab ? (
          <TokenList
            state={state}
            onSelectToken={selectToken}
            onAddToken={addToken}
          />
        ) : (
          <>
            <NodeEditToolbar
              isInsertEnabled={isInsertEnabled}
              isRemoveEnabled={isRemoveEnabled}
              onInsert={insertNode}
              onRemove={removeNode}
            />
            <DocumentTree
              state={state}
              onSelect={selectNode}
              onReorder={reorderNode}
            />
            <ComponentList
              components={EditorState.document(state).components}
              isInsertEnabled={isInsertEnabled}
              onInsert={(componentName) =>
                insertNode({ kind: "instance", componentName })
              }
            />
          </>
        )}
      </EditorLayout.LeftPane>
      <EditorLayout.CenterPane>
        <ArtboardCanvas
          state={state}
          onSelect={selectNodeAt}
          onMoveNode={moveNode}
          onResize={resize}
          onEditProp={editProp}
        />
        <DocumentErrorList errors={state.errors} />
      </EditorLayout.CenterPane>
      <EditorLayout.RightPane>
        {isTokensTab ? (
          <TokenEditor
            state={state}
            onSetTokenValue={setTokenValue}
            onRenameToken={renameToken}
            onRemoveToken={removeToken}
          />
        ) : (
          <PropertyPanel
            state={state}
            onEditProp={editProp}
            onClearSelection={() => dispatch({ type: "clear_selection" })}
          />
        )}
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
  path,
}: Readonly<{ ipc: DocumentIpc; path: string }>) {
  const { state, dispatch } = useEditor();

  const autoSaveFailure = useAutoSave({
    ipc,
    path,
    document: EditorState.document(state),
  });
  const watchFailure = useDocumentReload({
    ipc,
    path,
    onReload: (reload) => dispatch({ type: "reload_document", reload }),
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DocumentSyncFailureList
        autoSave={autoSaveFailure}
        watch={watchFailure}
      />
      <EditorPanes />
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
      <EditorBody ipc={ipc} path={opened.path} />
    </EditorProvider>
  );
}

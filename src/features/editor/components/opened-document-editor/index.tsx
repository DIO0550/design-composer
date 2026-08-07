import type { AxisLength } from "@/domains/axis-length";
import type { ChildPosition } from "@/domains/child-position";
import type { PropEdit } from "@/domains/node";
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
import { NodeEditToolbar } from "@/features/editor/components/node-edit-toolbar";
import { PropertyPanel } from "@/features/editor/components/property-panel";
import { EditorState } from "@/features/editor/domains/editor-state";
import type { NodeTemplate } from "@/features/editor/domains/node-template";
import type { OpenedDocument } from "@/features/editor/domains/opened-document";
import { useAutoSave } from "@/features/editor/hooks/use-auto-save";
import { useDeleteShortcut } from "@/features/editor/hooks/use-delete-shortcut";
import { useDocumentReload } from "@/features/editor/hooks/use-document-reload";
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
  const isInsertEnabled = EditorState.insertPosition(state).some;
  const isRemoveEnabled = EditorState.removableName(state).some;

  /** 削除はボタンとキーボードの両方から届く（どちらも選択中のものを消す）。 */
  useDeleteShortcut(removeNode);

  return (
    <EditorLayout>
      <EditorLayout.LeftPane>
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
          components={state.document.components}
          isInsertEnabled={isInsertEnabled}
          onInsert={(componentName) =>
            insertNode({ kind: "instance", componentName })
          }
        />
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
        <PropertyPanel
          state={state}
          onEditProp={editProp}
          onClearSelection={() => dispatch({ type: "clear_selection" })}
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
  path,
}: Readonly<{ ipc: DocumentIpc; path: string }>) {
  const { state, dispatch } = useEditor();

  const autoSaveFailure = useAutoSave({ ipc, path, document: state.document });
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

import type { AxisLength } from "@/domains/axis-length";
import type { ChildPosition } from "@/domains/child-position";
import type { PropEdit } from "@/domains/node";
import { useEditor } from "@/features/editor/components/editor-provider";
import { EditorState } from "@/features/editor/domains/editor-state";
import type { NodeTemplate } from "@/features/editor/domains/node-template";

/**
 * ツリー・キャンバス・プロパティパネルから届くノード編集の操作
 * （docs/06-ui.md「編集操作の一覧」「キャンバス直接操作」）。
 *
 * 押せるかどうか（`isInsertEnabled` / `isRemoveEnabled`）まで一緒に返すのは、
 * 出す / 出さないの判断が同じ選択から決まるため。判断そのものは `EditorState` が持ち、
 * ここは読み出して渡すだけ（rules/hooks.md「hooks はドメインロジックを持たない」）。
 */
export type NodeActions = Readonly<{
  select: (name: string) => void;
  selectAt: (names: readonly string[]) => void;
  clearSelection: () => void;
  reorder: (from: ChildPosition, toIndex: number) => void;
  move: (name: string, to: ChildPosition) => void;
  resize: (size: AxisLength) => void;
  editProp: (edit: PropEdit) => void;
  insert: (template: NodeTemplate) => void;
  insertInstance: (componentName: string) => void;
  remove: () => void;
  isInsertEnabled: boolean;
  isRemoveEnabled: boolean;
}>;

/**
 * ノード編集の操作をエディタの状態へ仲介する。
 *
 * キーボードだけの操作（コピー & ペースト・undo / redo）はここに含めない。
 * 画面の部品から呼ぶ相手がおらず、`useEditShortcuts` が張るためだけに
 * 戻り値へ並べることになるため。
 */
export function useNodeActions(): NodeActions {
  const { state, dispatch } = useEditor();

  return {
    select: (name) => dispatch({ type: "select", name }),
    /**
     * キャンバスは押された位置から外へ辿った名前を渡す。どれを選ぶかは状態側の判断
     * （選択できる最も内側のもの / `EditorState.selectInnermost`）。
     */
    selectAt: (names) => dispatch({ type: "select_innermost", names }),
    clearSelection: () => dispatch({ type: "clear_selection" }),
    reorder: (from, toIndex) =>
      dispatch({ type: "reorder_node", from, toIndex }),
    /** キャンバスのドラッグはツリー内の移動（docs/06-ui.md「キャンバス直接操作」）。 */
    move: (name, to) => dispatch({ type: "move_node", name, to }),
    /** リサイズハンドルのドラッグは選択中のものの大きさの変更（docs/06-ui.md）。 */
    resize: (size) => dispatch({ type: "resize", size }),
    /**
     * prop の編集はプロパティパネルとキャンバスのインライン編集の両方から届く
     * （どちらも選択中のものへの編集なので同じアクションで受ける）。
     */
    editProp: (edit) => dispatch({ type: "apply_prop_edit", edit }),
    insert: (template) => dispatch({ type: "insert_node", template }),
    /** 部品一覧からの挿入は、その部品のインスタンスを挿すこと（docs/06-ui.md）。 */
    insertInstance: (componentName) =>
      dispatch({
        type: "insert_node",
        template: { kind: "instance", componentName },
      }),
    remove: () => dispatch({ type: "remove_node" }),
    /**
     * 挿入と削除は選択中のものを起点にするため、押せるかどうかも選択から決まる
     * （docs/06-ui.md「編集操作の一覧」）。
     */
    isInsertEnabled: EditorState.insertPosition(state).some,
    isRemoveEnabled: EditorState.removableName(state).some,
  };
}

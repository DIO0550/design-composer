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
 * 押せるかどうか（`isInsertEnabled`）まで一緒に返すのは、出す / 出さないの判断が
 * 同じ選択から決まるため。判断そのものは `EditorState` が持ち、
 * ここは読み出して渡すだけ（rules/hooks.md「hooks はドメインロジックを持たない」）。
 */
export type NodeActions = Readonly<{
  select: (name: string) => void;
  selectAt: (names: readonly string[]) => void;
  clearSelection: () => void;
  /** エラー行から、そのエラーが指すノードを見せる（#136）。 */
  reveal: (nodeName: string) => void;
  reorder: (from: ChildPosition, toIndex: number) => void;
  move: (name: string, to: ChildPosition) => void;
  resize: (size: AxisLength) => void;
  editProp: (edit: PropEdit) => void;
  insert: (template: NodeTemplate) => void;
  /** パレットから運んできたものを、落とした先のツリー位置へ挿す（#203）。 */
  insertAt: (template: NodeTemplate, at: ChildPosition) => void;
  detachInstance: () => void;
  /** 同じ部品を指すインスタンスをまとめて選ぶ（`Select all N instances`）。 */
  selectAllInstances: () => void;
  createComponent: (componentName: string) => void;
  isInsertEnabled: boolean;
}>;

/**
 * ノード編集の操作をエディタの状態へ仲介する。
 *
 * キーボードだけの操作（削除・コピー & ペースト・undo / redo）はここに含めない。
 * 画面の部品から呼ぶ相手がおらず、`useEditShortcuts` が張るためだけに
 * 戻り値へ並べることになるため（削除は #112 でボタンを失ってこちら側になった）。
 *
 * @returns 選択・prop の編集・挿入など、画面の部品から呼ぶ操作
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
    /*
     * `select` と分けているのは、エラーの飛び先が表示中のドキュメントに
     * 無いことがあるため（`EditorState.reveal` の doc）。
     */
    reveal: (nodeName) => dispatch({ type: "reveal", name: nodeName }),
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
    /**
     * パレットからのドラッグは、落とした先へ挿すこと（UI 案 docs/Design Composer.html は
     * `Assets` を挿入がドラッグ専用の browse-only とする）。選択位置ではなく落とし先へ
     * 挿すので `insert` とは別のアクションになる。
     */
    insertAt: (template, at) =>
      dispatch({ type: "insert_node_at", template, at }),
    /**
     * インスタンスの解除は選択中のものへの操作なので、対象を渡さない
     * （UI 案 docs/Design Composer.html の `Detach instance`）。
     */
    detachInstance: () => dispatch({ type: "detach_instance" }),
    selectAllInstances: () => dispatch({ type: "select_all_instances" }),
    /**
     * 部品化も選択中のものへの操作なので、渡すのは新しい部品に付ける名前だけ
     * （docs/06-ui.md「部品化（Create Component）」の「操作時に部品名のみを入力させる」）。
     */
    createComponent: (componentName) =>
      dispatch({ type: "create_component", componentName }),
    /**
     * 挿入は選択中のものを起点にするため、押せるかどうかも選択から決まる
     * （docs/06-ui.md「編集操作の一覧」）。
     */
    isInsertEnabled: EditorState.insertPosition(state).some,
  };
}

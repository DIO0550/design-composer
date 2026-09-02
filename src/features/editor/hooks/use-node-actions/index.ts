import type { AxisLength } from "@/domains/dcmp/axis-length";
import type { ChildPosition } from "@/domains/dcmp/child-position";
import type { PropEdit } from "@/domains/dcmp/node";
import type { AbsolutePlacement } from "@/domains/dcmp/placement";
import type { NodeTemplate } from "@/domains/session/node-template";
import type { Offset } from "@/domains/unit/offset";
import { useEditor } from "@/features/editor/components/editor-provider";
import { EditorState } from "@/features/editor/domains/editor-state";

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
  /** 絶対配置のノードを親の中の別の座標へ置き直す（#381）。 */
  reposition: (name: string, placement: AbsolutePlacement) => void;
  /** artboard をキャンバス上の別の位置へ置き直す（#390）。 */
  repositionArtboard: (name: string, canvasPosition: Offset) => void;
  resize: (sizes: readonly AxisLength[]) => void;
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
    /**
     * キャンバスのドラッグは、既定ではツリー内の移動
     * （docs/06-ui.md「キャンバス直接操作」）。
     */
    move: (name, to) => dispatch({ type: "move_node", name, to }),
    /**
     * 運んでいるノードが絶対配置なら、同じドラッグが座標の置き直しになる（#381）。
     * どちらになるかはキャンバス側が運んでいるノードの配置を見て決める。
     */
    reposition: (name, placement) =>
      dispatch({ type: "reposition_node", name, placement }),
    /**
     * artboard の見出し・背景を掴んだドラッグはキャンバス上の移動（#390 / #392）。
     * ノードの座標移動と別のアクションなのは、相手が artboard で座標系も違うため。
     */
    repositionArtboard: (name, canvasPosition) =>
      dispatch({ type: "reposition_artboard", name, canvasPosition }),
    /** リサイズハンドルのドラッグは選択中のものの大きさの変更（docs/06-ui.md）。 */
    resize: (sizes) => dispatch({ type: "resize", sizes }),
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

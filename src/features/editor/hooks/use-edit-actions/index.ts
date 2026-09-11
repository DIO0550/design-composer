import type { Offset } from "@/domains/unit/offset";
import { useEditor } from "@/features/editor/components/editor-provider";
import type { ReorderStep } from "@/features/editor/domains/reorder-step";

/**
 * キーボードの割り当てとコンテキストメニューの行が共有する編集操作
 * （docs/06-ui.md「編集操作の一覧」）。
 *
 * どちらの入口も対象を渡さず、選択と編集履歴から決める。画面の部品（ツリー・キャンバス・
 * プロパティパネル）から届く操作は `useNodeActions` が持つ。
 */
export type EditActions = Readonly<{
  copy: () => void;
  paste: () => void;
  undo: () => void;
  redo: () => void;
  /** 選んでいるものを、ノードならサブツリーごと・artboard なら 1 枚ごと消す。 */
  removeSelected: () => void;
  /** 選んでいるノードを兄弟の並びの中で 1 つぶん動かす。 */
  reorderSelected: (step: ReorderStep) => void;
  /** 選んでいる絶対配置のノードの座標をずらす。 */
  repositionSelectedBy: (delta: Offset) => void;
}>;

/**
 * 割り当てとメニューが共有する編集操作を、エディタの状態へ仲介する。
 *
 * 対象が無いときは状態側が「その操作は存在しない」と答える（各アクションの `none`）ので、
 * 押せるかどうかはここで判定しない。
 *
 * @returns コピー & ペースト・undo / redo・削除・並べ替え・座標の移動
 */
export function useEditActions(): EditActions {
  const { dispatch } = useEditor();

  return {
    copy: () => dispatch({ type: "copy_node" }),
    paste: () => dispatch({ type: "paste_node" }),
    undo: () => dispatch({ type: "undo" }),
    redo: () => dispatch({ type: "redo" }),
    removeSelected: () => dispatch({ type: "remove_selected" }),
    reorderSelected: (step) =>
      dispatch({ type: "reorder_selected_node", step }),
    repositionSelectedBy: (delta) =>
      dispatch({ type: "reposition_selected_node", delta }),
  };
}

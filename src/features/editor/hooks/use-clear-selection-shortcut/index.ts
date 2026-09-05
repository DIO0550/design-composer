import {
  type KeyShortcut,
  KeyTriggers,
  useKeyShortcut,
} from "@/hooks/use-key-shortcut";

/** 選択解除に割り当てる組み合わせ。修飾キーは伴わない。 */
const ClearSelectionShortcut: KeyShortcut = {
  kind: KeyTriggers.TypedCharacter,
  keys: ["Escape"],
  withCommandKey: false,
  withShiftKey: false,
};

/**
 * 選んでいるものを外す操作をキーボードから行えるようにする
 * （docs/06-ui.md「選択」/ #414）。
 *
 * このフックが持つのは「選択解除に割り当てる組み合わせはどれか」だけで、
 * ページ全体で受けることと入力中は無視することは `useKeyShortcut` に任せる。
 *
 * 外れるのはノードの選択だけで、トークンの選択（Tokens タブ）は残る。
 * 2 つは別の選択で、片方を外す操作がもう片方を巻き込むと、
 * トークンを選んだままキャンバスのノードを選び直すことができなくなる。
 *
 * @param onClearSelection 組み合わせが押されたときに呼ぶ手続き
 */
export function useClearSelectionShortcut(onClearSelection: () => void): void {
  useKeyShortcut(ClearSelectionShortcut, onClearSelection);
}

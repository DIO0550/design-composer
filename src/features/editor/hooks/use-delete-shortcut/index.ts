import {
  type KeyShortcut,
  KeyTriggers,
  useKeyShortcut,
} from "@/hooks/use-key-shortcut";

/** 削除に割り当てる組み合わせ。Windows / macOS どちらの流儀でも消せるよう両方を受ける。 */
const DeleteShortcut: KeyShortcut = {
  waitsFor: KeyTriggers.TypedCharacter,
  keys: ["Delete", "Backspace"],
  withCommandKey: false,
  withShiftKey: false,
};

/**
 * 選んでいるもの（ノード / artboard）の削除をキーボードから行えるようにする
 * （docs/06-ui.md「編集操作の一覧」の削除と artboard 操作 / #39）。
 *
 * このフックが持つのは「削除に割り当てる組み合わせはどれか」だけで、
 * ページ全体で受けることと入力中は無視することは `useKeyShortcut` に任せる。
 *
 * @param onDelete 組み合わせが押されたときに呼ぶ手続き
 */
export function useDeleteShortcut(onDelete: () => void): void {
  useKeyShortcut(DeleteShortcut, onDelete);
}

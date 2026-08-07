import { useKeyShortcut } from "@/hooks/use-key-shortcut";

/** 削除に割り当てるキー。Windows / macOS どちらの流儀でも消せるよう両方を受ける。 */
const DELETE_KEYS: readonly string[] = ["Delete", "Backspace"];

/**
 * 選択中のノードの削除をキーボードから行えるようにする
 * （docs/06-ui.md「編集操作の一覧」の削除 / #39）。
 *
 * このフックが持つのは「削除に割り当てるキーはどれか」だけで、
 * ページ全体で受けることと入力中は無視することは `useKeyShortcut` に任せる。
 */
export function useDeleteShortcut(onDelete: () => void): void {
  useKeyShortcut(DELETE_KEYS, onDelete);
}

import { type KeyShortcut, useKeyShortcut } from "@/hooks/use-key-shortcut";

/** コピーに割り当てる組み合わせ（Windows は Ctrl+C / macOS は Cmd+C）。 */
const CopyShortcut: KeyShortcut = {
  keys: ["c"],
  withCommandKey: true,
  withShiftKey: false,
};

/**
 * 選択中のノードのコピーをキーボードから行えるようにする
 * （docs/06-ui.md「編集操作の一覧」のコピー & ペースト / #40）。
 *
 * このフックが持つのは「コピーに割り当てる組み合わせはどれか」だけで、
 * ページ全体で受けることと入力中は無視することは `useKeyShortcut` に任せる。
 *
 * @param onCopy 組み合わせが押されたときに呼ぶ手続き
 */
export function useCopyShortcut(onCopy: () => void): void {
  useKeyShortcut(CopyShortcut, onCopy);
}

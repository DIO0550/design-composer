import {
  type KeyShortcut,
  KeyTriggers,
  useKeyShortcut,
} from "@/hooks/use-key-shortcut";

/** ペーストに割り当てる組み合わせ（Windows は Ctrl+V / macOS は Cmd+V）。 */
const PasteShortcut: KeyShortcut = {
  kind: KeyTriggers.TypedCharacter,
  keys: ["v"],
  withCommandKey: true,
  withShiftKey: false,
};

/**
 * クリップボードの中身のペーストをキーボードから行えるようにする
 * （docs/06-ui.md「編集操作の一覧」のコピー & ペースト / #40）。
 *
 * このフックが持つのは「ペーストに割り当てる組み合わせはどれか」だけで、
 * ページ全体で受けることと入力中は無視することは `useKeyShortcut` に任せる。
 *
 * @param onPaste 組み合わせが押されたときに呼ぶ手続き
 */
export function usePasteShortcut(onPaste: () => void): void {
  useKeyShortcut(PasteShortcut, onPaste);
}

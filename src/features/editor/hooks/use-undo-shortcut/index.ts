import { type KeyShortcut, useKeyShortcut } from "@/hooks/use-key-shortcut";

/** undo に割り当てる組み合わせ（Windows は Ctrl+Z / macOS は Cmd+Z）。 */
const UNDO_SHORTCUT: KeyShortcut = {
  keys: ["z"],
  withCommandKey: true,
  withShiftKey: false,
};

/**
 * 直前の編集の取り消しをキーボードから行えるようにする
 * （docs/06-ui.md「編集操作の一覧」の undo / #41）。
 *
 * このフックが持つのは「undo に割り当てる組み合わせはどれか」だけで、
 * ページ全体で受けることと入力中は無視することは `useKeyShortcut` に任せる。
 */
export function useUndoShortcut(onUndo: () => void): void {
  useKeyShortcut(UNDO_SHORTCUT, onUndo);
}

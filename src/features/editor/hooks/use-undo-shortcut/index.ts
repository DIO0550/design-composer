import {
  type KeyShortcut,
  KeyTriggers,
  useKeyShortcut,
} from "@/hooks/use-key-shortcut";

/** undo に割り当てる組み合わせ（Windows は Ctrl+Z / macOS は Cmd+Z）。 */
const UndoShortcut: KeyShortcut = {
  waitsFor: KeyTriggers.TypedCharacter,
  keys: ["z"],
  withCommandKey: true,
  withShiftKey: false,
};

/**
 * 直前の編集を戻す操作をキーボードから行えるようにする
 * （docs/06-ui.md「編集操作の一覧」の undo / #41）。
 *
 * このフックが持つのは「undo に割り当てる組み合わせはどれか」だけで、
 * ページ全体で受けることと入力中は無視することは `useKeyShortcut` に任せる。
 *
 * @param onUndo 組み合わせが押されたときに呼ぶ手続き
 */
export function useUndoShortcut(onUndo: () => void): void {
  useKeyShortcut(UndoShortcut, onUndo);
}

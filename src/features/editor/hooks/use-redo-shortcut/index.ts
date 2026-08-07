import { type KeyShortcut, useKeyShortcut } from "@/hooks/use-key-shortcut";

/**
 * redo に割り当てる組み合わせ（Windows は Ctrl+Shift+Z / macOS は Cmd+Shift+Z）。
 *
 * Windows の流儀にある Ctrl+Y は割り当てない。#41 が挙げているのは Shift+Z だけで、
 * 仕様に無いキーを先回りで押さえると、後から別の操作へ割り当てにくくなるため。
 */
const REDO_SHORTCUT: KeyShortcut = {
  keys: ["z"],
  withCommandKey: true,
  withShiftKey: true,
};

/**
 * undo で戻した編集をやり直す操作をキーボードから行えるようにする
 * （docs/06-ui.md「編集操作の一覧」の redo / #41）。
 *
 * このフックが持つのは「redo に割り当てる組み合わせはどれか」だけで、
 * ページ全体で受けることと入力中は無視することは `useKeyShortcut` に任せる。
 */
export function useRedoShortcut(onRedo: () => void): void {
  useKeyShortcut(REDO_SHORTCUT, onRedo);
}

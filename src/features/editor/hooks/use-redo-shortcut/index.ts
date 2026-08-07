import { type KeyShortcut, useKeyShortcut } from "@/hooks/use-key-shortcut";

/**
 * redo に割り当てる組み合わせ（Windows は Ctrl+Shift+Z / macOS は Cmd+Shift+Z）。
 *
 * Windows 流儀の Ctrl+Y は受けない。issue（#41）と docs/06-ui.md が挙げているのは
 * Cmd/Ctrl+Z / Shift+Z だけで、仕様に無いキー割り当てを先回りで足さないため。
 */
const REDO_SHORTCUT: KeyShortcut = {
  keys: ["z"],
  withCommandKey: true,
  withShiftKey: true,
};

/**
 * 取り消した編集のやり直しをキーボードから行えるようにする
 * （docs/06-ui.md「編集操作の一覧」の redo / #41）。
 *
 * このフックが持つのは「redo に割り当てる組み合わせはどれか」だけで、
 * ページ全体で受けることと入力中は無視することは `useKeyShortcut` に任せる。
 */
export function useRedoShortcut(onRedo: () => void): void {
  useKeyShortcut(REDO_SHORTCUT, onRedo);
}

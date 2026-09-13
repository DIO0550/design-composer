import {
  type KeyShortcut,
  KeyTriggers,
  useKeyShortcut,
} from "@/hooks/use-key-shortcut";

/**
 * グループ解除に割り当てる組み合わせ（Windows は Ctrl+Shift+G / macOS は Cmd+Shift+G）。
 */
const UngroupShortcut: KeyShortcut = {
  kind: KeyTriggers.TypedCharacter,
  keys: ["g"],
  withCommandKey: true,
  withShiftKey: true,
};

/**
 * 選んでいる Box を外す操作をキーボードから行えるようにする（docs/06-ui.md「編集操作の一
 * 覧」のグループ解除）。
 *
 * このフックが持つのは「グループ解除に割り当てる組み合わせはどれか」だけで、
 * ページ全体で受けることと入力中は無視することは `useKeyShortcut` に任せる。
 *
 * webview の「前を検索」と重なるが、`useKeyShortcut` は当たった割り当ての既定動作を止める
 * ので、この割り当てが当たる経路では検索へ渡らない。
 *
 * @param onUngroup 組み合わせが押されたときに呼ぶ手続き
 */
export function useUngroupShortcut(onUngroup: () => void): void {
  useKeyShortcut(UngroupShortcut, onUngroup);
}

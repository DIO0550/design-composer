import {
  type KeyShortcut,
  KeyTriggers,
  useKeyShortcut,
} from "@/hooks/use-key-shortcut";

/** グループ化に割り当てる組み合わせ（Windows は Ctrl+G / macOS は Cmd+G）。 */
const GroupShortcut: KeyShortcut = {
  kind: KeyTriggers.TypedCharacter,
  keys: ["g"],
  withCommandKey: true,
  withShiftKey: false,
};

/**
 * 選んでいるノードを Box で包む操作をキーボードから行えるようにする（docs/06-ui.md「編集
 * 操作の一覧」のグループ化）。
 *
 * このフックが持つのは「グループ化に割り当てる組み合わせはどれか」だけで、
 * ページ全体で受けることと入力中は無視することは `useKeyShortcut` に任せる。
 *
 * webview の「次を検索」と重なるが、`useKeyShortcut` は当たった割り当ての既定動作を止める
 * ので、この割り当てが当たる経路では検索へ渡らない。
 *
 * @param onGroup 組み合わせが押されたときに呼ぶ手続き
 */
export function useGroupShortcut(onGroup: () => void): void {
  useKeyShortcut(GroupShortcut, onGroup);
}

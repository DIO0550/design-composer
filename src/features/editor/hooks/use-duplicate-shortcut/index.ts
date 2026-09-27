import {
  type KeyShortcut,
  KeyTriggers,
  useKeyShortcut,
} from "@/hooks/use-key-shortcut";

/** 複製に割り当てる組み合わせ（Windows は Ctrl+D / macOS は Cmd+D）。 */
const DuplicateShortcut: KeyShortcut = {
  kind: KeyTriggers.TypedCharacter,
  keys: ["d"],
  withCommandKey: true,
  withShiftKey: false,
};

/**
 * 選択中のノードの複製をキーボードから行えるようにする（docs/06-ui.md「編集操作の一覧」
 * の複製）。
 *
 * このフックが持つのは「複製に割り当てる組み合わせはどれか」だけで、
 * ページ全体で受けることと入力中は無視することは `useKeyShortcut` に任せる。
 *
 * ブラウザの「ブックマークに追加」と重なるが、`useKeyShortcut` は当たった割り当ての既定動作
 * を止めるので、この割り当てが当たる経路ではブックマークへ渡らない。
 *
 * @param onDuplicate 組み合わせが押されたときに呼ぶ手続き
 */
export function useDuplicateShortcut(onDuplicate: () => void): void {
  useKeyShortcut(DuplicateShortcut, onDuplicate);
}

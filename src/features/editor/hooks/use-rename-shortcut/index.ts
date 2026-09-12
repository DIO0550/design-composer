import {
  type KeyShortcut,
  KeyTriggers,
  useKeyShortcut,
} from "@/hooks/use-key-shortcut";

/** 名前の変更に割り当てる組み合わせ（UI 案 docs/Design Composer.html の `Rename ⌘R`）。 */
const RenameShortcut: KeyShortcut = {
  kind: KeyTriggers.TypedCharacter,
  keys: ["r"],
  withCommandKey: true,
  withShiftKey: false,
};

/**
 * 選んでいるものの名前の編集を、キーボードから始められるようにする
 * （docs/06-ui.md「編集操作の一覧」の名前を変更）。
 *
 * webview の再読み込みと重なるが、`useKeyShortcut` は当たった割り当ての既定動作を止める
 * ので、この割り当てが当たる経路では再読み込みは起きない。
 *
 * @param onRename 組み合わせが押されたときに呼ぶ手続き
 */
export function useRenameShortcut(onRename: () => void): void {
  useKeyShortcut(RenameShortcut, onRename);
}

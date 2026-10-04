import {
  type KeyShortcutBinding,
  KeyTriggers,
  useKeyShortcuts,
} from "@/hooks/use-key-shortcut";

/** 数字で指せるタブの数（⌘1〜⌘9）。 */
const NumberedTabCount = 9;

/**
 * タブ列の左から N 番目のタブへ移る操作を、⌘1〜⌘9 / Ctrl+1〜9 で行えるようにする
 * （docs/06-ui.md「開いているドキュメントの行き来」）。
 *
 * このフックが持つのは「どの数字がどの位置か」だけで、ページ全体で受けることと入力中は
 * 無視することは `useKeyShortcuts` に任せる。並びに無い位置を指したときに何も起きないこと
 * は、受け取る側が決める。
 *
 * @param onActivateTab 割り当てが押されたときに、タブの位置（左端が 0）で呼ぶ手続き
 */
export function useActivateTabShortcut(
  onActivateTab: (index: number) => void,
): void {
  const bindings: readonly KeyShortcutBinding[] = Array.from(
    { length: NumberedTabCount },
    (_, index) => ({
      shortcut: {
        kind: KeyTriggers.PhysicalKey,
        codes: [`Digit${index + 1}`],
        withCommandKey: true,
        withShiftKey: false,
      },
      onPress: () => onActivateTab(index),
    }),
  );

  useKeyShortcuts(bindings);
}

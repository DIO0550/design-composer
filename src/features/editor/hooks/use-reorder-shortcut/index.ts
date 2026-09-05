import {
  type ReorderStep,
  ReorderSteps,
} from "@/features/editor/domains/reorder-step";
import {
  type KeyShortcutBinding,
  KeyTriggers,
  useKeyShortcuts,
} from "@/hooks/use-key-shortcut";

/**
 * 並べ替えに割り当てるキーと、その向き
 * （Windows は Ctrl+] / Ctrl+[、macOS は Cmd+] / Cmd+[）。
 *
 * キーは押した向きの見出しなので、値の別名ではなく綴りのまま置く
 * （rules/naming.md「対応表のキーを PascalCase にするのは「キーが値の別名」のときだけ」）。
 */
const ReorderKeys = {
  "]": ReorderSteps.TowardFront,
  "[": ReorderSteps.TowardBack,
} as const satisfies Readonly<Record<string, ReorderStep>>;

/**
 * 選んでいるノードを兄弟の並びの中で 1 つぶん動かす操作を、キーボードから行えるようにする
 * （docs/06-ui.md「編集操作の一覧」の並べ替え / #417）。
 *
 * このフックが持つのは「どのキーがどちらの向きか」だけで、ページ全体で受けることと
 * 入力中は無視することは `useKeyShortcuts` に任せる。
 *
 * 2 件をまとめて張るのは、押したキーで渡す向きが変わるため。
 * 1 つの割り当ての `keys` に 2 つ並べると同じ操作の別名になってしまい、区別できない。
 *
 * Why not: 表から割り当てを組み立てる形を `use-reposition-shortcut` と共有しない。
 * 畳むと渡す値の型を型引数で受けることになり、消費側 2 つのために型引数が 1 つ増える。
 *
 * @param onReorder 割り当てが押されたときに、その向きで呼ぶ手続き
 */
export function useReorderShortcut(
  onReorder: (step: ReorderStep) => void,
): void {
  const bindings: readonly KeyShortcutBinding[] = Object.entries(
    ReorderKeys,
  ).map(([key, step]) => ({
    shortcut: {
      kind: KeyTriggers.TypedCharacter,
      keys: [key],
      withCommandKey: true,
      withShiftKey: false,
    },
    onPress: () => onReorder(step),
  }));

  useKeyShortcuts(bindings);
}

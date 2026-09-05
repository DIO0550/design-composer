import {
  type ReorderStep,
  ReorderSteps,
} from "@/features/editor/domains/reorder-step";
import {
  type KeyShortcutPress,
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
 * 2 件をまとめて張るのは、押したキーで渡す向きが変わるため。
 * `KeyShortcut.keys` に 2 つ並べると同じ操作の別名になってしまい、区別できない。
 *
 * @param onReorder 割り当てが押されたときに、その向きで呼ぶ手続き
 */
export function useReorderShortcut(
  onReorder: (step: ReorderStep) => void,
): void {
  const presses: readonly KeyShortcutPress[] = Object.entries(ReorderKeys).map(
    ([key, step]) => ({
      shortcut: { keys: [key], withCommandKey: true, withShiftKey: false },
      onPress: () => onReorder(step),
    }),
  );

  useKeyShortcuts(presses);
}

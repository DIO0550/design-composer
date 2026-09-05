import { Offset } from "@/domains/unit/offset";
import {
  type KeyShortcutBinding,
  KeyTriggers,
  useKeyShortcuts,
} from "@/hooks/use-key-shortcut";

/**
 * 矢印キーと、そのキーが指す向き（長さ 1 の移動量）。
 *
 * キーは押した向きの見出しなので、綴りのまま置く
 * （rules/naming.md「対応表のキーを PascalCase にするのは「キーが値の別名」のときだけ」）。
 */
const ArrowDirections = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
} as const satisfies Readonly<Record<string, Offset>>;

/**
 * Shift の有無と、1 回あたりに動かす長さ（ドキュメント上の px）。
 *
 * 値そのものは docs/06-ui.md「キャンバス直接操作」にあるが、**10px を選んだ根拠**は
 * docs に無いのでここに置く。1px との差が一目で分かる最小の桁だから（#413 で決めた）。
 */
const MoveLengths = [
  { withShiftKey: false, length: 1 },
  { withShiftKey: true, length: 10 },
] as const;

/**
 * 選んでいる絶対配置のノードを少しずつ動かす操作を、キーボードから行えるようにする
 * （docs/06-ui.md「キャンバス直接操作」/ #413）。
 *
 * このフックが持つのは「どのキーがどれだけの移動量か」だけで、ページ全体で受けることと
 * 入力中は無視することは `useKeyShortcuts` に任せる。
 *
 * 8 件をまとめて張るのは、押したキーで渡す移動量が変わるため。
 * 1 つの割り当ての `keys` に矢印を並べると同じ操作の別名になってしまい、向きを区別できない。
 *
 * キーの綴りと刻みの大きさはこの入力経路の事情なので、渡すのは解釈済みの移動量にする
 * （rules/architecture.md「入力欄の約束事をドメインへ持ち込まない」）。
 *
 * @param onReposition 割り当てが押されたときに、その移動量で呼ぶ手続き
 */
export function useRepositionShortcut(
  onReposition: (delta: Offset) => void,
): void {
  const bindings: readonly KeyShortcutBinding[] = MoveLengths.flatMap(
    ({ withShiftKey, length }) =>
      Object.entries(ArrowDirections).map(([key, direction]) => ({
        shortcut: {
          kind: KeyTriggers.TypedCharacter,
          keys: [key],
          withCommandKey: false,
          withShiftKey,
        },
        onPress: () => onReposition(Offset.scale(direction, length)),
      })),
  );

  useKeyShortcuts(bindings);
}

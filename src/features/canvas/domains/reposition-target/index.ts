import { ChildPlacement } from "@/domains/dcmp/child-placement";
import { type AbsolutePlacement, Placement } from "@/domains/dcmp/placement";
import type { Offset } from "@/domains/unit/offset";

/**
 * 落とし先の親と、今の親の左上から見たその左上のずれ（ドキュメント上の px）。
 *
 * 絶対配置の座標は親の左上を原点にするので、名前だけでは座標をいくら直せばよいかが
 * 決まらない。片方だけを持ち回れないよう対で 1 つの型にする。
 * 落とし先が今の親と同じなら、ずれは 0 になる（同じ左上を見るため）。
 */
export type ParentShift = Readonly<{ name: string; shift: Offset }>;

/**
 * 絶対配置のノードを運んで離したときの行き先（#388）。
 * ツリーへ落とすときの `DropTarget` と対になる、座標で動かすときの落とし先。
 *
 * 書かれる座標（`to`）と、運んでいる間に見た目をずらす量（`offset`）を対で持つ。
 * 親を付け替えると座標の原点が変わるので、**画面上の位置を変えない**ために
 * 書かれる座標だけが原点のずれを含み、見た目のずらし量は運んだ分のままになる。
 * 2 つは同じ 1 回のドラッグの別々の見え方で、別々に組むと食い違うため
 * `create` からしか作らない。
 */
export type RepositionTarget = Readonly<{
  to: ChildPlacement;
  offset: Offset;
}>;

export const RepositionTarget = {
  /**
   * 掴んだ時点の配置と、画面上で運んだ量から行き先を決める。
   *
   * 見た目のずらし量を運んだ量そのものではなく**丸めた行き先から逆算**するのは、
   * 座標が整数へ丸められるため（`Placement.moveBy`）。逆算しないと、運んでいる間の
   * 見た目と離したあとの位置が 1px 未満ずれる。
   *
   * @param from 掴んだ時点の配置（今の親から見た座標）
   * @param carried 画面上で運んだ量（ドキュメント上の px）
   * @param parent 落とし先の親と、今の親の左上から見たその左上のずれ
   * @returns 落とし先の親から見た座標と、運んでいる間のずらし量
   */
  create(
    from: AbsolutePlacement,
    carried: Offset,
    parent: ParentShift,
  ): RepositionTarget {
    const moved = Placement.moveBy(from, carried);
    return {
      to: ChildPlacement.create(
        parent.name,
        Placement.moveBy(moved, parent.shift),
      ),
      offset: Placement.delta(from, moved),
    };
  },
} as const;

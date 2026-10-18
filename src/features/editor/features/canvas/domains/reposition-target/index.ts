import { ChildPlacement } from "@/domains/dcmp/child-placement";
import { type AbsolutePlacement, Placement } from "@/domains/dcmp/placement";
import type { Angle } from "@/domains/unit/angle";
import { Offset } from "@/domains/unit/offset";

/**
 * 掴んだ時点の配置と、それを測っている今の親の画面上の向き（祖先の合計）。
 *
 * 絶対配置の座標は親の向きで測るので、向きを知らないと画面上で運んだ量を座標へ戻せない。
 * 片方だけを持ち回れないよう対で 1 つの型にする。
 */
export type GrabbedPlacement = Readonly<{
  placement: AbsolutePlacement;
  parentRotation: Angle;
}>;

/**
 * 落とし先の親と、その親の座標（docs/06-ui.md「キャンバス直接操作」）へ直すための材料。
 *
 * 絶対配置の座標は親ごとに原点と向きが違うので、名前だけでは座標をどう直せばよいかが
 * 決まらない。片方だけを持ち回れないよう 1 つの型にする。
 * 落とし先が今の親と同じなら、`shift` は 0 になり向きも今の親と同じになる。
 */
export type DropParentCoordinates = Readonly<{
  name: string;
  /** 今の親の座標の原点を、落とし先の親の座標で見た位置（ドキュメント上の px）。 */
  shift: Offset;
  /** 落とし先の親の画面上の向き（祖先の合計）。 */
  rotation: Angle;
}>;

/**
 * 絶対配置のノードを運んで離したときの行き先。ツリーへ落とすときの `DropTarget` と対になる、
 * 座標で動かすときの落とし先。
 *
 * 書かれる座標（`to`）と、運んでいる間に見た目をずらす量（`offset`）を対で持つ。
 * 親を付け替えると座標の原点と向きが変わるので、**座標が指す点の画面上の位置を変えない**
 * ために書かれる座標だけが落とし先の親の座標へ直され、見た目のずらし量は今の親の向きで
 * 測った運んだ分のままになる。2 つは同じ 1 回のドラッグの別々の見え方で、別々に組むと
 * 食い違うため `create` からしか作らない。
 */
export type RepositionTarget = Readonly<{
  to: ChildPlacement;
  offset: Offset;
}>;

/**
 * 画面上で運んだ量を今の親の向きへ戻して動かした、丸めた行き先。
 *
 * @param from 掴んだ時点の配置と今の親の向き
 * @param carried 画面上で運んだ量（ドキュメント上の px）
 * @returns 今の親の座標で見た行き先
 */
function movedInParent(
  from: GrabbedPlacement,
  carried: Offset,
): AbsolutePlacement {
  return Placement.moveBy(
    from.placement,
    Offset.rotate(carried, -from.parentRotation),
  );
}

/**
 * 掴んだ時点の配置から丸めた行き先までの、運んでいる間のずらし量。
 *
 * @param from 掴んだ時点の配置と今の親の向き
 * @param moved 今の親の座標で見た、丸めた行き先（`movedInParent` の答え）
 * @returns 今の親の向きで測ったずらし量（丸めた行き先から逆算した整数）
 */
function offsetToward(
  from: GrabbedPlacement,
  moved: AbsolutePlacement,
): Offset {
  return Placement.delta(from.placement, moved);
}

export const RepositionTarget = {
  /**
   * 掴んだ時点の配置と、画面上で運んだ量から行き先を決める。
   *
   * 逆算しないと、運んでいる間の見た目と離したあとの位置が 1px 未満ずれる。
   *
   * @param from 掴んだ時点の配置（今の親の座標）と今の親の向き
   * @param carried 画面上で運んだ量（ドキュメント上の px）
   * @param dropParent 落とし先の親と、その座標へ直すための原点の位置と向き
   * @returns 落とし先の親の座標で見た行き先と、運んでいる間のずらし量
   */
  create(
    from: GrabbedPlacement,
    carried: Offset,
    dropParent: DropParentCoordinates,
  ): RepositionTarget {
    const moved = movedInParent(from, carried);
    const point = Placement.offset(moved);
    const turned = Offset.rotate(
      point,
      from.parentRotation - dropParent.rotation,
    );
    return {
      to: ChildPlacement.create(
        dropParent.name,
        Placement.moveBy(
          moved,
          Offset.add(Offset.delta(point, turned), dropParent.shift),
        ),
      ),
      offset: offsetToward(from, moved),
    };
  },

  /**
   * 運んでいる間のずらし量だけを、落とし先の親を決めずに求める。
   *
   * 落とし先の親の座標へ直すのは**書かれる座標**だけなので、ずらし量は落とし先が
   * 決まらなくても答えられる。落とせる親がポインタの下に無い間も掴んだノードを
   * 追従させるために要る（`Carrying`）。
   *
   * @param from 掴んだ時点の配置（今の親の座標）と今の親の向き
   * @param carried 画面上で運んだ量（ドキュメント上の px）
   * @returns 今の親の向きで測ったずらし量（丸めた行き先から逆算した整数）
   */
  carriedOffset(from: GrabbedPlacement, carried: Offset): Offset {
    return offsetToward(from, movedInParent(from, carried));
  },
} as const;

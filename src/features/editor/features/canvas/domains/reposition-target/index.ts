import { ChildPlacement } from "@/domains/dcmp/child-placement";
import { type AbsolutePlacement, Placement } from "@/domains/dcmp/placement";
import { RepositionEdit } from "@/domains/dcmp/reposition-edit";
import { Angle } from "@/domains/unit/angle";
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
 * 掴んだ時点の配置に、向きの違う親へ付け替えるときに見た目を保つための自分の形を足したもの。
 *
 * 付け替えで自分の向きを書き換えると、回る中心（回る前の矩形の中心）の位置が座標の原点
 * （回る前の左上）から見て向きの差だけ回る。中心を動かさないよう座標を直すには、自分の向きと
 * 左上から中心までの差が要る。
 */
export type GrabbedGeometry = GrabbedPlacement &
  Readonly<{
    /** 自分の `rotation`（今の親の向きを基準にした角度）。 */
    ownRotation: Angle;
    /** 回る前の左上の角から中心までの差（ドキュメント上の px）。 */
    centerFromTopLeft: Offset;
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
 * 書き込む内容（`written`）と、運んでいる間に見た目をずらす量（`offset`）を対で持つ。
 * 親を付け替えると座標の原点と向きが変わるので、**画面上の向きと中心の位置を変えない**ために
 * 書き込む座標と向きだけが落とし先の親を基準に直され、見た目のずらし量は今の親の向きで
 * 測った運んだ分のままになる。2 つは同じ 1 回のドラッグの別々の見え方で、別々に組むと
 * 食い違うため `create` からしか作らない。
 */
export type RepositionTarget = Readonly<{
  written: RepositionEdit;
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
   * 今の親と落とし先の親の向きの差が 360 度の倍数でなければ、自分の向きを差だけ書き換え、
   * 座標は回る前の左上ではなく中心が同じ位置に来るように直す。倍数なら向きは書かず、左上を
   * 保つ（このとき中心も同じ位置に来る）。向きの差と書く向きは `Angle.roundToMicrodegree` で
   * 丸める（丸める理由はそちら）。
   *
   * @param from 掴んだ時点の配置（今の親の座標）・今の親の向き・自分の向き・回る前の左上から
   *   中心までの差
   * @param carried 画面上で運んだ量（ドキュメント上の px）
   * @param dropParent 落とし先の親と、その座標へ直すための原点の位置と向き
   * @returns 落とし先の親を基準にした書き込む内容（座標と、向きを書き換えるならその向き）と、
   *   運んでいる間のずらし量
   */
  create(
    from: GrabbedGeometry,
    carried: Offset,
    dropParent: DropParentCoordinates,
  ): RepositionTarget {
    const moved = movedInParent(from, carried);
    const rotationGap = Angle.roundToMicrodegree(
      from.parentRotation - dropParent.rotation,
    );
    const center = Offset.add(Placement.offset(moved), from.centerFromTopLeft);
    // 向きの差が 360 度の倍数なら `Offset.rotate` が元と同じ値を返すので、左上を保つ
    const to = ChildPlacement.create(
      dropParent.name,
      Placement.moveBy(
        moved,
        Offset.add(
          Offset.delta(center, Offset.rotate(center, rotationGap)),
          dropParent.shift,
        ),
      ),
    );
    return {
      written: Angle.isWholeTurns(rotationGap)
        ? RepositionEdit.create(to)
        : RepositionEdit.rotatedTo(
            to,
            Angle.roundToMicrodegree(from.ownRotation + rotationGap),
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

import { ChildPlacement } from "@/domains/dcmp/child-placement";
import { type AbsolutePlacement, Placement } from "@/domains/dcmp/placement";
import {
  type NodeRepositionEdit,
  RepositionEdit,
} from "@/domains/dcmp/reposition-edit";
import type {
  SiblingPlacement,
  SiblingPlacements,
} from "@/domains/dcmp/sibling-placements";
import { Angle } from "@/domains/unit/angle";
import { Offset } from "@/domains/unit/offset";
import type { NonEmptyArray } from "@/types/NonEmptyArray";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

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
 * 掴んだ時点の、まとめて運ぶ兄弟と、その座標を測っている今の親の画面上の向き（祖先の合計）。
 *
 * 1 つだけ運ぶときも、一員が 1 つの兄弟として扱う。
 */
export type GrabbedSiblings = SiblingPlacements &
  Readonly<{
    parentRotation: Angle;
  }>;

/** まとめて運ぶ一員の、掴んだ時点の座標と自分の形（`GrabbedGeometry` の一員ぶん）。 */
export type GrabbedMemberGeometry = SiblingPlacement &
  Readonly<{
    /** 自分の `rotation`（今の親の向きを基準にした角度）。 */
    ownRotation: Angle;
    /** 回る前の左上の角から中心までの差（ドキュメント上の px）。 */
    centerFromTopLeft: Offset;
  }>;

/**
 * 掴んだ時点の兄弟に、向きの違う親へ付け替えるときに見た目を保つための一員ごとの形を
 * 足したもの（`GrabbedPlacement` に対する `GrabbedGeometry` と同じ組）。
 */
export type GrabbedSiblingsGeometry = Readonly<{
  parentName: string;
  parentRotation: Angle;
  /** 一員それぞれの座標と形。ツリー順。 */
  placed: NonEmptyArray<GrabbedMemberGeometry>;
}>;

/**
 * 絶対配置のノードを運んで離したときの、ノード 1 つぶんの行き先。どの親へ書くかは持たず、
 * まとめた `SiblingsRepositionTarget` が全員ぶんを 1 つだけ持つ。
 *
 * 書き込む座標と向き（`placement` / `rotation`）と、運んでいる間に見た目をずらす量
 * （`offset`）を対で持つ。親を付け替えると座標の原点と向きが変わるので、**画面上の向きと中心
 * の位置を変えない**ために書き込む座標と向きだけが落とし先の親を基準に直され、見た目の
 * ずらし量は今の親の向きで測った運んだ分のままになる。2 つは同じ 1 回のドラッグの別々の
 * 見え方で、別々に組むと食い違うため `create` からしか作らない。
 */
export type RepositionTarget = Readonly<{
  /** 落とし先の親から見た、書き込む座標。 */
  placement: AbsolutePlacement;
  /** 書き込む自分の向き。向きを書き換えないなら `none`。 */
  rotation: Option<Angle>;
  offset: Offset;
}>;

/**
 * 運んでいる間、運んでいるノード（まとめて運ぶなら全員）をどれだけずらして見せるか。
 *
 * 一員は同じ親の兄弟なので、ずらして見せる間に親の切り取りを解く相手は 1 つに決まる。
 */
export type RepositionPreview = Readonly<{
  /** 運んでいるノードの今の親の名前。 */
  parentName: string;
  /** 一員それぞれの名前と、ずらす量（ドキュメント上の px）。 */
  members: NonEmptyArray<Readonly<{ name: string; offset: Offset }>>;
}>;

/**
 * 絶対配置の兄弟（1 つだけ運ぶなら一員が 1 つ）を運んで離したときの行き先。
 *
 * 全員を同じ 1 つの親へ書くので、落とし先の親は一員ごとではなくここに 1 つだけ持つ。
 */
export type SiblingsRepositionTarget = Readonly<{
  /** 一員が今いる親の名前。 */
  parentName: string;
  /** 一員を書き込む落とし先の親の名前。 */
  dropParentName: string;
  /** 一員それぞれの名前と行き先。ツリー順。 */
  members: NonEmptyArray<Readonly<{ name: string; target: RepositionTarget }>>;
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
   * @returns 落とし先の親を基準にした書き込む座標と、向きを書き換えるならその向きと、
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
    const placement = Placement.moveBy(
      moved,
      Offset.add(
        Offset.delta(center, Offset.rotate(center, rotationGap)),
        dropParent.shift,
      ),
    );
    return {
      placement,
      rotation: Angle.isWholeTurns(rotationGap)
        ? Option.none
        : Option.some(Angle.roundToMicrodegree(from.ownRotation + rotationGap)),
      offset: offsetToward(from, moved),
    };
  },

  /**
   * 運んでいる間のずらし量だけを、落とし先の親を決めずに求める。
   *
   * 落とし先の親の座標へ直すのは**書かれる座標**だけなので、ずらし量は落とし先が
   * 決まらなくても答えられる。落とせる親がポインタの下に無い間も運んでいるもの（まとめて
   * 運ぶなら全員）を追従させるために要る（`Carrying`）。
   *
   * @param from 掴んだ時点の配置（今の親の座標）と今の親の向き
   * @param carried 画面上で運んだ量（ドキュメント上の px）
   * @returns 今の親の向きで測ったずらし量（丸めた行き先から逆算した整数）
   */
  carriedOffset(from: GrabbedPlacement, carried: Offset): Offset {
    return offsetToward(from, movedInParent(from, carried));
  },
} as const;

export const SiblingsRepositionTarget = {
  /**
   * 掴んだ時点の兄弟と、画面上で運んだ量から、全員の行き先を決める。
   *
   * 全員に同じ運んだ量を渡し、一員ごとに `RepositionTarget.create` で行き先を決める。丸めは
   * 一員ごとに行うので、小数の座標を持つ一員がいると一員どうしの間隔が 1px 未満ずれうる。
   *
   * @param grabbed 掴んだ時点の兄弟（今の親の座標）・今の親の向き・一員ごとの自分の向きと
   *   回る前の左上から中心までの差
   * @param carried 画面上で運んだ量（ドキュメント上の px）
   * @param dropParent 落とし先の親と、その座標へ直すための原点の位置と向き
   * @returns 落とし先の親と、一員ごとの書き込む内容と運んでいる間のずらし量
   */
  create(
    grabbed: GrabbedSiblingsGeometry,
    carried: Offset,
    dropParent: DropParentCoordinates,
  ): SiblingsRepositionTarget {
    return {
      parentName: grabbed.parentName,
      dropParentName: dropParent.name,
      members: ArrayEx.mapNonEmpty(grabbed.placed, (member) => ({
        name: member.name,
        target: RepositionTarget.create(
          {
            placement: member.placement,
            parentRotation: grabbed.parentRotation,
            ownRotation: member.ownRotation,
            centerFromTopLeft: member.centerFromTopLeft,
          },
          carried,
          dropParent,
        ),
      })),
    };
  },

  /**
   * 離したときにドキュメントへ届ける、全員ぶんの置き直し。
   *
   * @param target 全員の行き先
   * @returns 一員ごとの、落とし先の親と座標（向きを書き換えるならその向き）。ツリー順
   */
  toEdits(target: SiblingsRepositionTarget): NonEmptyArray<NodeRepositionEdit> {
    return ArrayEx.mapNonEmpty(target.members, (member) => {
      const to = ChildPlacement.create(
        target.dropParentName,
        member.target.placement,
      );
      const rotation = member.target.rotation;
      return {
        name: member.name,
        edit: Option.isSome(rotation)
          ? RepositionEdit.rotatedTo(to, rotation.value)
          : RepositionEdit.create(to),
      };
    });
  },

  /**
   * 運んでいる間、全員をどれだけずらして見せるか。
   *
   * @param target 全員の行き先
   * @returns 今の親と、一員ごとのずらし量
   */
  preview(target: SiblingsRepositionTarget): RepositionPreview {
    return {
      parentName: target.parentName,
      members: ArrayEx.mapNonEmpty(target.members, (member) => ({
        name: member.name,
        offset: member.target.offset,
      })),
    };
  },

  /**
   * 落とし先の親を決めずに、運んでいる間に全員をどれだけずらして見せるか
   * （`RepositionTarget.carriedOffset` の全員ぶん）。
   *
   * @param grabbed 掴んだ時点の兄弟（今の親の座標）と今の親の向き
   * @param carried 画面上で運んだ量（ドキュメント上の px）
   * @returns 今の親と、一員ごとのずらし量
   */
  carriedPreview(grabbed: GrabbedSiblings, carried: Offset): RepositionPreview {
    return {
      parentName: grabbed.parentName,
      members: ArrayEx.mapNonEmpty(grabbed.placed, (member) => ({
        name: member.name,
        offset: RepositionTarget.carriedOffset(
          {
            placement: member.placement,
            parentRotation: grabbed.parentRotation,
          },
          carried,
        ),
      })),
    };
  },
} as const;

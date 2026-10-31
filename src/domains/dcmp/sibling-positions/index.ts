import type { ChildPosition } from "@/domains/dcmp/child-position";
import type { NonEmptyArray } from "@/types/NonEmptyArray";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * 同じ親の兄弟として並んでいる、いくつかのノードの位置（docs/06-ui.md「複数選択」の
 * 並べ替え・グループ化）。
 *
 * 親が 1 つに決まっていることと、位置が 1 つ以上あることを構造で持つ。位置は重複せず、
 * 小さい順に並ぶ。
 */
export type SiblingPositions = Readonly<{
  /** 兄弟すべての親の名前。 */
  parentName: string;
  /** 兄弟それぞれの、親の子の並びの中での位置。重複せず小さい順。 */
  indices: NonEmptyArray<number>;
}>;

export const SiblingPositions = {
  /**
   * 位置がすべて同じ親の中にあるときの、兄弟の位置。
   *
   * @param positions 兄弟として扱いたい位置。順は問わず、同じ位置は 1 つとして扱う
   * @returns 親と、重複を除いて小さい順に並べた位置。親が 2 つ以上あるときは `none`
   */
  fromChildPositions(
    positions: NonEmptyArray<ChildPosition>,
  ): Option<SiblingPositions> {
    const ascending = ArrayEx.sortBy(
      positions.map((position) => position.index),
      (index) => index,
    );

    return Option.flatMap(
      ArrayEx.singleDistinct(positions.map((position) => position.parentName)),
      (parentName) =>
        Option.map(
          ArrayEx.toNonEmpty(ArrayEx.distinct(ascending)),
          (indices): SiblingPositions => ({ parentName, indices }),
        ),
    );
  },

  /**
   * 兄弟をすべて抜いた並びで見た、位置がいちばん大きかった兄弟の位置（グループ化で、まとめた
   * Box を挿す位置）。
   *
   * それより小さい位置にいた兄弟が抜けると、そのぶんだけ位置が小さくなる（`[1, 3]` を抜いた
   * 並びでは、3 にいたものの位置は 2）。
   *
   * @param siblings 抜く兄弟の位置
   * @returns 同じ親の中で、いちばん大きい位置から、抜く兄弟のうちそれ以外の兄弟の数を引いた位置
   */
  lastAfterRemoving(siblings: SiblingPositions): ChildPosition {
    const { indices } = siblings;
    const last = indices[indices.length - 1];

    return {
      parentName: siblings.parentName,
      index: last - (indices.length - 1),
    };
  },
} as const;

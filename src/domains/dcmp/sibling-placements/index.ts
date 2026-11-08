import type { ChildPlacement } from "@/domains/dcmp/child-placement";
import type { AbsolutePlacement } from "@/domains/dcmp/placement";
import type { NonEmptyArray } from "@/types/NonEmptyArray";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * 同じ親の兄弟として並んでいる、いくつかの絶対配置のノードと、それぞれの座標
 * （docs/06-ui.md「キャンバス直接操作」の、複数選択をまとめて運ぶ移動）。
 *
 * 親が 1 つに決まっていることと、一員が 1 つ以上いることを構造で持つ。一員は親の子の並びの
 * 順（ツリー順）に並ぶ。
 */
export type SiblingPlacements = Readonly<{
  /** 一員すべての親の名前。 */
  parentName: string;
  /** 一員それぞれの名前と、親から見た座標。ツリー順。 */
  members: NonEmptyArray<SiblingPlacement>;
}>;

/** 兄弟の一員の名前と、親から見た座標。 */
export type SiblingPlacement = Readonly<{
  name: string;
  placement: AbsolutePlacement;
}>;

/** 兄弟として扱いたいノード 1 つの、名前・置かれている場所・並びの位置。 */
export type PlacedChild = Readonly<{
  name: string;
  /** 今いる親と、その親から見た座標。 */
  at: ChildPlacement;
  /** 親の子の並びの中での位置。 */
  index: number;
}>;

export const SiblingPlacements = {
  /**
   * どれも同じ親の中にいるときの、兄弟の座標。
   *
   * 同じノードを 2 回渡すと一員として 2 回並ぶ。重複は入口（`DesignDocument.findSiblingPlacements`）
   * が名前の段階で除く。
   *
   * @param children 兄弟として扱いたいノード。順は問わない
   * @returns 親と、並びの位置の小さい順に並べた一員。親が 2 つ以上あるときは `none`
   */
  fromPlacedChildren(
    children: NonEmptyArray<PlacedChild>,
  ): Option<SiblingPlacements> {
    const ascending = ArrayEx.sortBy(children, (child) => child.index);

    return Option.flatMap(
      ArrayEx.singleDistinct(children.map((child) => child.at.parentName)),
      (parentName) =>
        Option.map(
          ArrayEx.toNonEmpty(
            ascending.map(
              (child): SiblingPlacement => ({
                name: child.name,
                placement: child.at.placement,
              }),
            ),
          ),
          (members): SiblingPlacements => ({ parentName, members }),
        ),
    );
  },

  /**
   * 一員すべての名前。
   *
   * @param siblings 名前を知りたい兄弟
   * @returns 一員の名前（ツリー順）
   */
  names(siblings: SiblingPlacements): NonEmptyArray<string> {
    return ArrayEx.mapNonEmpty(siblings.members, (member) => member.name);
  },
} as const;

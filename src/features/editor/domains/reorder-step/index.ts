import type { ChildPosition } from "@/domains/dcmp/child-position";
import type { SiblingPositions } from "@/features/editor/domains/sibling-positions";
import type { ChildReorder } from "@/features/editor/types/ChildReorder";
import type { ValueOf } from "@/types/ValueOf";

/**
 * 兄弟の並びの中で 1 つぶん動かす向き（docs/06-ui.md「編集操作の一覧」の並べ替え）。
 */
export const ReorderSteps = {
  TowardFront: "toward-front",
  TowardBack: "toward-back",
} as const;

/** 並べ替えの向き。 */
export type ReorderStep = ValueOf<typeof ReorderSteps>;

/**
 * この向きの 1 歩で、兄弟の並びの中の index がいくつ動くか。
 *
 * 前面へが `+1` なのは、並びの末尾が最前面だから（docs/06-ui.md「キャンバス直接操作」）。
 * 規則そのものは並び側の約束だが、`ChildPosition` は `dcmp`（ファイルに書かれる中身）で
 * 編集操作の語彙を知れないため、向きを持つこちら側が持つ。
 *
 * @param step 動かす向き
 * @returns 前面へなら `1`、背面へなら `-1`
 */
function offsetOf(step: ReorderStep): number {
  switch (step) {
    case "toward-front":
      return 1;
    case "toward-back":
      return -1;
  }
}

export const ReorderStep = {
  /**
   * この 1 歩ぶん動かした先の、兄弟の並びの中での index。
   *
   * 並びの外へ出る index も返す。動かせるかどうかは並びの長さを知っている側
   * （`DesignDocument.reorderNode`）が失敗として答える。
   *
   * @param step 動かす向き
   * @param from 今いる位置
   * @returns 動かした先の index
   */
  toIndex(step: ReorderStep, from: ChildPosition): number {
    return from.index + offsetOf(step);
  },

  /**
   * 兄弟たちをそれぞれこの 1 歩ぶん動かす指定を、当てる順に並べる（docs/06-ui.md「複数選択」の
   * 並べ替え）。選んだものの中でいちばん前面（背面へなら背面）にあるものから並ぶ。
   *
   * `from.index` は前の指定を当てたあとの並びで読む値で、この順に当てれば元の位置と一致する
   * （先に動くものは、後に当てる子の位置を動かさない）。
   *
   * 選んだ群が外側の選んでいない兄弟 1 つを越える動かし方は採らない。前面へ動かしてから
   * 背面へ動かしても元の並びに戻らないため。
   *
   * @param step 動かす向き
   * @param from 動かす兄弟たちの親と、小さい順の位置
   * @returns 当てる順に並べた指定
   */
  toChildReorders(
    step: ReorderStep,
    from: SiblingPositions,
  ): readonly ChildReorder[] {
    const ascending: readonly number[] = from.indices;
    // 動く向きの先にいるものから当てる。位置は小さい順なので、前面へなら逆から読む
    const ordered = offsetOf(step) > 0 ? [...ascending].reverse() : ascending;
    return ordered.map((index) => {
      const position: ChildPosition = { parentName: from.parentName, index };
      return { from: position, toIndex: ReorderStep.toIndex(step, position) };
    });
  },
} as const;

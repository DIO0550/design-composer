import { type AxisEnd, AxisEnds } from "@/domains/unit/axis";
import { SidePair } from "@/domains/unit/side";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";
import { Range } from "@/utils/Range";

/**
 * 兄弟が並ぶ列の端の隣で、列と同じ間隔になる位置 1 つ分（docs/06-ui.md「キャンバス直接
 * 操作」の等間隔。すべて画面上の px）。
 *
 * 位置ではなく端の子・向き・間隔で持つ。始点側に置く位置は運んでいるものの大きさで変わ
 * るので、運ぶものが決まるまで座標にできない。
 */
export type IntervalSlot = Readonly<{
  /** 列が伸びる向きの 2 辺の組（水平なら横に並ぶ列） */
  pair: SidePair;
  /** 列の端にある子 */
  neighbor: CanvasBounds;
  /** 端の子のどちら側か。終点側なら右（下）、始点側なら左（上） */
  end: AxisEnd;
  /** 端の子と、列の内側でそれと隣り合う子の間隔（0 より大きい） */
  interval: number;
}>;

/** 列の向きに進んで子を探すときの、向きと進む側。 */
type Facing = Pick<IntervalSlot, "pair" | "end">;

/** 列の向きに進んで子を探すときの材料。 */
type Sweep = Readonly<{ siblings: readonly CanvasBounds[]; facing: Facing }>;

export const IntervalSlot = {
  /**
   * 兄弟の並びから、列の端の隣で同じ間隔になる位置を集める。どれを隣り合う組・列の端と
   * みなすかは docs/06-ui.md「キャンバス直接操作」の等間隔に従う。
   *
   * @param siblings 間隔を測る兄弟の矩形の並び（同じ距離なら先の子から作った位置が先に並ぶ）
   * @param pair 列が伸びる向きの 2 辺の組
   * @returns 同じ間隔になる位置の並び。隣り合う組が無ければ空
   */
  collect(
    siblings: readonly CanvasBounds[],
    pair: SidePair,
  ): readonly IntervalSlot[] {
    const forward = { pair, end: AxisEnds.End };
    const backward = { pair, end: AxisEnds.Start };
    return siblings.flatMap((before) => {
      const after = firstReached(before, { siblings, facing: forward });
      if (!Option.isSome(after)) {
        return [];
      }
      const interval = distanceTo(before, after.value, forward);
      // 探索は接している子でも止まる（その先を隣にしない）ので、0 はここで外す
      if (interval === 0) {
        return [];
      }
      const endSlots = isOutermost(after.value, { siblings, facing: forward })
        ? [{ ...forward, neighbor: after.value, interval }]
        : [];
      const startSlots = isOutermost(before, { siblings, facing: backward })
        ? [{ ...backward, neighbor: before, interval }]
        : [];
      return [...startSlots, ...endSlots];
    });
  },

  /**
   * その位置へ運んでいるものを寄せる量。
   *
   * 端の子ともう一方の軸で重なるかは寄せる前の行き先で見る。重ならない子の隣へ寄せると、
   * 列に並んでいないものが列の間隔に吸い付く。
   *
   * @param slot 同じ間隔になる位置
   * @param moving 運んでいるものの行き先の矩形（寄せる前）
   * @returns 列の向きの寄せ量。運んでいるものが端の子ともう一方の軸で重ならなければ `none`
   */
  toShift(slot: IntervalSlot, moving: CanvasBounds): Option<number> {
    if (!overlapsAcross(slot.neighbor, moving, slot.pair)) {
      return Option.none;
    }
    const neighbor = CanvasBounds.extentAlong(slot.neighbor, slot.pair);
    const carried = CanvasBounds.extentAlong(moving, slot.pair);
    switch (slot.end) {
      case AxisEnds.End:
        return Option.some(neighbor.max + slot.interval - carried.min);
      case AxisEnds.Start:
        return Option.some(neighbor.min - slot.interval - carried.max);
    }
  },
} as const;

/**
 * 列の向きに進んで、もう一方の軸で重なる子のうち最初に当たるもの。
 *
 * @param from 進み始める子
 * @param sweep 探す兄弟の並びと、進む向き
 * @returns 最初に当たる子。同じ距離なら並びの先のもの。当たる子が無ければ `none`
 */
function firstReached(from: CanvasBounds, sweep: Sweep): Option<CanvasBounds> {
  const ahead = sweep.siblings.filter((other) => {
    const isAhead =
      other !== from &&
      overlapsAcross(from, other, sweep.facing.pair) &&
      distanceTo(from, other, sweep.facing) >= 0;
    return isAhead;
  });
  return ArrayEx.minBy(ahead, (other) => distanceTo(from, other, sweep.facing));
}

/**
 * その子が、進む向きで列のいちばん外側にあるか。
 *
 * @param bounds 見る子
 * @param sweep 探す兄弟の並びと、進む向き
 * @returns その向きにもう一方の軸で重なる子がいなければ `true`
 */
function isOutermost(bounds: CanvasBounds, sweep: Sweep): boolean {
  return !Option.isSome(firstReached(bounds, sweep));
}

/**
 * 進む向きに測った、2 つの子の間の距離。
 *
 * @param from 進み始める子
 * @param to 測る相手の子
 * @param facing 進む向き
 * @returns `from` の進む側の辺から `to` の手前の辺までの距離。`to` が後ろにある / 重なって
 *   いるなら負
 */
function distanceTo(
  from: CanvasBounds,
  to: CanvasBounds,
  facing: Facing,
): number {
  const fromExtent = CanvasBounds.extentAlong(from, facing.pair);
  const toExtent = CanvasBounds.extentAlong(to, facing.pair);
  switch (facing.end) {
    case AxisEnds.End:
      return toExtent.min - fromExtent.max;
    case AxisEnds.Start:
      return fromExtent.min - toExtent.max;
  }
}

/**
 * 2 つの矩形が、列の向きと直交する軸で幅を持って重なるか。接するだけなら重ならない
 * （上下に接して積んだ 2 つは、横の列としては別の行にある）。
 *
 * @param bounds 見る矩形
 * @param other 重なりを見る相手の矩形
 * @param pair 列が伸びる向きの 2 辺の組
 * @returns 直交する軸の範囲が重なっていれば `true`
 */
function overlapsAcross(
  bounds: CanvasBounds,
  other: CanvasBounds,
  pair: SidePair,
): boolean {
  const across = SidePair.perpendicular(pair);
  return (
    Range.intersectionLength(
      CanvasBounds.extentAlong(bounds, across),
      CanvasBounds.extentAlong(other, across),
    ) > 0
  );
}

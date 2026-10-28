import { type AxisEnd, AxisEnds } from "@/domains/unit/axis";
import type { SidePair } from "@/domains/unit/side";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { Facing } from "@/features/editor/features/canvas/domains/facing";
import { Option } from "@/utils/Option";

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
      const after = Facing.firstReached(forward, {
        from: before,
        candidates: siblings,
      });
      if (!Option.isSome(after)) {
        return [];
      }
      const interval = Facing.distanceTo(forward, {
        from: before,
        to: after.value,
      });
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
    if (!Facing.overlapsAcross(slot, { from: slot.neighbor, to: moving })) {
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
 * その子が、進む向きで列のいちばん外側にあるか。
 *
 * @param bounds 見る子
 * @param sweep 探す兄弟の並びと、進む向き
 * @returns その向きにもう一方の軸で重なる子がいなければ `true`
 */
function isOutermost(bounds: CanvasBounds, sweep: Sweep): boolean {
  return !Option.isSome(
    Facing.firstReached(sweep.facing, {
      from: bounds,
      candidates: sweep.siblings,
    }),
  );
}

import { type AxisEnd, AxisEnds } from "@/domains/unit/axis";
import { SidePair } from "@/domains/unit/side";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import type { ThinLine } from "@/features/editor/features/canvas/domains/thin-line";
import { ArrayEx } from "@/utils/ArrayEx";
import { NumberEx } from "@/utils/NumberEx";
import { Option } from "@/utils/Option";
import { Range } from "@/utils/Range";

/**
 * 矩形から進んで相手を探すときの、向き（辺の組）と進む側。
 */
export type Facing = Readonly<{
  /** 進む向きの 2 辺の組（水平なら左右へ進む） */
  pair: SidePair;
  /** 進む側。終点側なら右（下）、始点側なら左（上） */
  end: AxisEnd;
}>;

/** 進み始める矩形と、測る相手の矩形（画面上の px）。 */
type Between = Readonly<{ from: CanvasBounds; to: CanvasBounds }>;

/**
 * 距離と重なりの長さを丸める桁。
 */
const PxDigits = { fractionDigits: 6 } as const;

export const Facing = {
  /**
   * 進む向きで、直交する軸で幅を持って重なる相手のうち最初に当たるもの。
   *
   * @param facing 進む向き
   * @param sweep 進み始める矩形と、探す相手の並び
   * @returns 最初に当たる相手。同じ距離なら並びの先。当たる相手が無ければ `none`
   */
  firstReached(
    facing: Facing,
    sweep: Readonly<{
      from: CanvasBounds;
      candidates: readonly CanvasBounds[];
    }>,
  ): Option<CanvasBounds> {
    const { from } = sweep;
    const ahead = sweep.candidates.filter((to) => {
      const isAhead =
        to !== from &&
        Facing.overlapsAcross(facing, { from, to }) &&
        Facing.distanceTo(facing, { from, to }) >= 0;
      return isAhead;
    });
    return ArrayEx.minBy(ahead, (to) =>
      Facing.distanceTo(facing, { from, to }),
    );
  },

  /**
   * 進む向きに測った、2 つの矩形の間の距離。
   *
   * @param facing 進む向き
   * @param between 進み始める矩形と測る相手
   * @returns `from` の進む側の辺から `to` の手前の辺までの距離を小数 6 桁へ丸めた値。
   *   後ろ / 重なっているなら負
   */
  distanceTo(facing: Facing, between: Between): number {
    const fromExtent = CanvasBounds.extentAlong(between.from, facing.pair);
    const toExtent = CanvasBounds.extentAlong(between.to, facing.pair);
    switch (facing.end) {
      case AxisEnds.End:
        return roundToMicroPx(toExtent.min - fromExtent.max);
      case AxisEnds.Start:
        return roundToMicroPx(fromExtent.min - toExtent.max);
    }
  },

  /**
   * 2 つの矩形が、進む向きと直交する軸で幅を持って重なるか。接するだけなら重ならない
   * （上下に接して積んだ 2 つは、横の列としては別の行にある）。
   *
   * 通り道に入るかの判定で前後とも同じなので `end` は見ない。前後は `distanceTo` が答える。
   * `IntervalSlot` が `pair` / `end` を持つので、`toShift` がそのまま渡せるよう `Facing` で受ける。
   *
   * @param facing 進む向き
   * @param between 見る矩形と、重なりを見る相手
   * @returns 直交する軸の範囲の重なりを小数 6 桁へ丸めて 0 より大きければ `true`
   */
  overlapsAcross(facing: Facing, between: Between): boolean {
    const across = SidePair.perpendicular(facing.pair);
    const overlap = Range.intersectionLength(
      CanvasBounds.extentAlong(between.from, across),
      CanvasBounds.extentAlong(between.to, across),
    );
    return roundToMicroPx(overlap) > 0;
  },

  /**
   * 進む向きに、2 つの矩形の間に引く短い線（画面上の px）。
   *
   * @param facing 進む向き
   * @param between 進み始める矩形と、線を引く相手
   * @returns `from` の進む側の辺から `to` の手前の辺までを、直交する軸で向かい合う範囲の
   *   中央に引く線。重なっている / 接している（小数 6 桁へ丸めて 0 以下）なら `none`
   */
  shortLineTo(facing: Facing, between: Between): Option<ThinLine> {
    if (Facing.distanceTo(facing, between) <= 0) {
      return Option.none;
    }
    const fromExtent = CanvasBounds.extentAlong(between.from, facing.pair);
    const toExtent = CanvasBounds.extentAlong(between.to, facing.pair);
    const span =
      facing.end === AxisEnds.End
        ? { min: fromExtent.max, max: toExtent.min }
        : { min: toExtent.max, max: fromExtent.min };
    return Option.some({
      along: facing.pair,
      at: overlapCenterAcross(facing, between),
      span,
    });
  },
} as const;

/**
 * 長さを小数 6 桁へ丸める（画面上の px）。
 *
 * 吸い付いたあとの辺は「左 + 幅」で作り直すので数 ULP ずれ、接した相手が外れる / 接する
 * だけが重なりになる（倍率 1.1 で約 4%）。許容幅で比べないのは、`ArrayEx.minBy` の同じ距離
 * の比較と `interval === 0` も書き直すことになるため。
 *
 * @param length 丸める長さ
 * @returns 小数 6 桁へ丸めた長さ
 */
function roundToMicroPx(length: number): number {
  return NumberEx.round(length, PxDigits);
}

/**
 * 直交する軸で 2 つが重なる範囲の中央。
 *
 * 重なりの有無は見ない。外側で辺が揃うと重なる範囲は幅 0 で、ここで重なりを見ると
 * #453 の隙間が消える（docs/06-ui.md の辺のスナップ）。
 *
 * @param facing 進む向き
 * @param between 2 つの矩形
 * @returns 内側の 2 つの端の真ん中の座標（画面上の px）
 */
function overlapCenterAcross(facing: Facing, between: Between): number {
  const across = SidePair.perpendicular(facing.pair);
  const fromExtent = CanvasBounds.extentAlong(between.from, across);
  const toExtent = CanvasBounds.extentAlong(between.to, across);
  return Range.center({
    min: Math.max(fromExtent.min, toExtent.min),
    max: Math.min(fromExtent.max, toExtent.max),
  });
}

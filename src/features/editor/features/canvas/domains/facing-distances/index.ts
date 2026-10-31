import { type AxisEnd, AxisEnds } from "@/domains/unit/axis";
import { SidePair, SidePairs } from "@/domains/unit/side";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { Facing } from "@/features/editor/features/canvas/domains/facing";
import { ThinLine } from "@/features/editor/features/canvas/domains/thin-line";
import { Option } from "@/utils/Option";

/**
 * 起点（`from`）から上下左右それぞれ、最初に当たる相手までの短い線（画面上の px）。
 * 中身は線だが、名前は docs/06-ui.md「キャンバス直接操作」の機能名「Alt / Option の距離」
 * （線と数値をまとめた呼び名）から借りている。
 *
 * キーは進む向きの 2 辺の組と進む側（`vertical` の `start` なら上へ進む）。
 */
export type FacingDistances = Readonly<
  Record<SidePair, Readonly<Record<AxisEnd, Option<ThinLine>>>>
>;

/** どの向きにも線が無い距離。 */
const None = {
  horizontal: { start: Option.none, end: Option.none },
  vertical: { start: Option.none, end: Option.none },
} as const satisfies FacingDistances;

export const FacingDistances = {
  None,

  /**
   * 上下左右それぞれの線を、向きごとの関数から組む。
   *
   * @param lineToward 進む向きを受けて、その向きの線を返す関数
   * @returns 4 つの向きそれぞれに `lineToward` の答えを入れたもの
   */
  fromFacings(
    lineToward: (facing: Facing) => Option<ThinLine>,
  ): FacingDistances {
    const along = (pair: SidePair) => ({
      start: lineToward({ pair, end: AxisEnds.Start }),
      end: lineToward({ pair, end: AxisEnds.End }),
    });
    return {
      horizontal: along(SidePairs.Horizontal),
      vertical: along(SidePairs.Vertical),
    };
  },

  /**
   * 起点から上下左右それぞれ、それを囲む親の縁か兄弟のうち最初に当たる相手までの短い線を
   * 引く（相手の選び方は docs/06-ui.md の Alt / Option の距離）。
   *
   * @param from 距離を測り始める矩形
   * @param parentBounds `from` を囲む親の矩形（運んでいる間は落とし先の親）
   * @param siblings その親の直下の、`from` 以外の子
   * @returns 向きごとの短い線（すべて画面上の px）。当たる相手が無い / 最初に当たる相手に
   *   接している向きは `none`（重なっている相手は飛ばす）
   */
  create({
    from,
    parentBounds,
    siblings,
  }: Readonly<{
    from: CanvasBounds;
    parentBounds: CanvasBounds;
    siblings: readonly CanvasBounds[];
  }>): FacingDistances {
    return FacingDistances.fromFacings((facing) => {
      // 親の縁を手前・奥の両方とも候補にする。向きの側の縁だけにすると、外側から縁に
      // 接したときにその縁を突き抜けて奥の縁まで測る
      const edges = SidePair.sides(facing.pair).map((side) =>
        CanvasBounds.sideBounds(parentBounds, side),
      );
      const candidates = [...edges, ...siblings];
      return lineToFirstReached(facing, from, candidates);
    });
  },

  /**
   * 上下左右それぞれ、`others` のうち最初に当たる相手までの短い線。親の縁は候補にしない
   * （docs/06-ui.md の artboard の移動と、選択しているだけのときの Alt / Option の距離）。
   *
   * @param from 距離を測り始める矩形
   * @param others 距離を測る相手の矩形
   * @returns 向きごとの短い線（すべて画面上の px）。当たる相手が無い / 最初に当たる相手に
   *   接している向きは `none`（重なっている相手は飛ばす）
   */
  createAmong({
    from,
    others,
  }: Readonly<{
    from: CanvasBounds;
    others: readonly CanvasBounds[];
  }>): FacingDistances {
    return FacingDistances.fromFacings((facing) =>
      lineToFirstReached(facing, from, others),
    );
  },

  /**
   * 上下左右のどれかの線が、`line` と同じ線上に重なるか（重なりの判定は `ThinLine.isCoinciding`）。
   *
   * @param distances 向きごとの短い線
   * @param line 比べる線（画面上の px）
   * @returns 4 つの向きのどれかの線が `line` と同じ線上に重なれば真。線の無い向きは見ない
   */
  hasCoinciding(distances: FacingDistances, line: ThinLine): boolean {
    const drawnLines = Object.values(SidePairs).flatMap((pair) =>
      Object.values(AxisEnds).flatMap((end) => {
        const distanceLine = distances[pair][end];
        return Option.isSome(distanceLine) ? [distanceLine.value] : [];
      }),
    );
    return drawnLines.some((distanceLine) =>
      ThinLine.isCoinciding(distanceLine, line),
    );
  },
} as const;

/**
 * 進む向きで、候補のうち最初に当たる相手までの短い線。
 *
 * @param facing 進む向き
 * @param from 距離を測り始める矩形
 * @param candidates 当たる相手の候補
 * @returns 最初に当たる相手までの短い線。当たる相手が無い / 最初に当たる相手に接しているなら
 *   `none`（重なっている相手は飛ばす）
 */
function lineToFirstReached(
  facing: Facing,
  from: CanvasBounds,
  candidates: readonly CanvasBounds[],
): Option<ThinLine> {
  return Option.flatMap(
    Facing.firstReached(facing, { from, candidates }),
    (to) => Facing.shortLineTo(facing, { from, to }),
  );
}

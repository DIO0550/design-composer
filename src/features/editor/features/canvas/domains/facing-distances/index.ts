import { type AxisEnd, AxisEnds } from "@/domains/unit/axis";
import { SidePair, SidePairs } from "@/domains/unit/side";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { Facing } from "@/features/editor/features/canvas/domains/facing";
import type { ThinLine } from "@/features/editor/features/canvas/domains/thin-line";
import { Option } from "@/utils/Option";

/**
 * 運んでいるものから上下左右それぞれ、最初に当たる相手までの短い線（Alt / Option の距離 /
 * docs/06-ui.md「キャンバス直接操作」）。画面上の px。
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
   * 運んでいるものから上下左右それぞれ、落とし先の親の縁か兄弟のうち最初に当たる相手までの
   * 短い線を引く（相手の選び方は docs/06-ui.md の Alt / Option の距離）。
   *
   * @param moved 寄せたあとの運んでいるものの矩形
   * @param parentBounds 落とし先の親の矩形
   * @param siblings その親の直下の、運んでいるもの以外の子
   * @returns 向きごとの短い線（すべて画面上の px）。当たる相手が無い / 相手に接している・
   *   重なっている向きは `none`
   */
  create({
    moved,
    parentBounds,
    siblings,
  }: Readonly<{
    moved: CanvasBounds;
    parentBounds: CanvasBounds;
    siblings: readonly CanvasBounds[];
  }>): FacingDistances {
    const toward = (facing: Facing): Option<ThinLine> => {
      // 親の縁を手前・奥の両方とも候補にする。向きの側の縁だけにすると、外側から縁に
      // 接したときにその縁を突き抜けて奥の縁まで測る
      const edges = SidePair.sides(facing.pair).map((side) =>
        CanvasBounds.sideBounds(parentBounds, side),
      );
      const candidates = [...edges, ...siblings];
      return Option.flatMap(
        Facing.firstReached(facing, { from: moved, candidates }),
        (to) => Facing.shortLineTo(facing, { from: moved, to }),
      );
    };
    const along = (pair: SidePair) => ({
      start: toward({ pair, end: AxisEnds.Start }),
      end: toward({ pair, end: AxisEnds.End }),
    });
    return {
      horizontal: along(SidePairs.Horizontal),
      vertical: along(SidePairs.Vertical),
    };
  },
} as const;

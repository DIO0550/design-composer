import { SidePair, SidePairs } from "@/domains/unit/side";
import type { FacingDistances } from "@/features/editor/features/canvas/domains/facing-distances";
import type { SnapGuides } from "@/features/editor/features/canvas/domains/side-snap";
import { ThinLine } from "@/features/editor/features/canvas/domains/thin-line";
import { Option } from "@/utils/Option";

/**
 * 座標の置き直しで運んでいる間に出す線。吸い付いた線と揃え先との隙間、Alt / Option の距離
 * （除く前）。すべて画面上の px。
 */
export type RepositionGuides = Readonly<{
  snap: SnapGuides;
  distances: FacingDistances;
}>;

export const RepositionGuides = {
  /**
   * Alt / Option の距離のうち、揃え先との隙間が同じ線を既に出している向きを除いたもの
   * （docs/06-ui.md の Alt / Option の距離。同じ線と数値を 2 つ重ねない）。
   *
   * 除いた結果を持たずに毎回計算する。持つと、除く前と除いたあとが食い違う組が書ける。
   *
   * @param guides 運んでいる間に出す線
   * @returns 隙間と同じ線になる向きを `none` にした距離
   */
  distancesExceptGaps(guides: RepositionGuides): FacingDistances {
    const along = (pair: SidePair) => {
      const gapLine = Option.flatMap(
        guides.snap[SidePair.perpendicular(pair)],
        (guide) => guide.gapLine,
      );
      const exceptGap = (line: Option<ThinLine>): Option<ThinLine> =>
        Option.flatMap(line, (distance) => {
          const isSameAsGap =
            Option.isSome(gapLine) && ThinLine.equals(gapLine.value, distance);
          return isSameAsGap ? Option.none : Option.some(distance);
        });
      return {
        start: exceptGap(guides.distances[pair].start),
        end: exceptGap(guides.distances[pair].end),
      };
    };
    return {
      horizontal: along(SidePairs.Horizontal),
      vertical: along(SidePairs.Vertical),
    };
  },
} as const;

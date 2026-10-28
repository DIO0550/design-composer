import type { Offset } from "@/domains/unit/offset";
import { SidePair } from "@/domains/unit/side";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { FacingDistances } from "@/features/editor/features/canvas/domains/facing-distances";
import {
  SideSnap,
  type SnapGuides,
} from "@/features/editor/features/canvas/domains/side-snap";
import { ThinLine } from "@/features/editor/features/canvas/domains/thin-line";
import { Option } from "@/utils/Option";

/**
 * 座標の置き直しで運んでいる間に出す線。吸い付いた線と揃え先との隙間、Alt / Option の距離
 * （除く前）。すべて画面上の px。
 */
export type RepositionLines = Readonly<{
  snap: SnapGuides;
  distanceLines: FacingDistances;
}>;

/**
 * Alt / Option の距離を測る相手（画面上の px）。
 */
export type DistanceTargets = Readonly<{
  /** 落とし先の親の矩形 */
  parentBounds: CanvasBounds;
  /** その親の直下の、運んでいるもの以外の子 */
  siblings: readonly CanvasBounds[];
}>;

/**
 * 座標の置き直し 1 回分の吸い付きの答え。
 */
export type RepositionSnapped = Readonly<{
  /** 寄せ量（画面上の px） */
  offset: Offset;
  lines: RepositionLines;
}>;

export const RepositionLines = {
  /**
   * 寄せ量と、寄せたあとの位置に出す線を 1 回の判定から作る。
   *
   * 寄せ量と線・距離を別々に作ると、離した位置と線がずれる。`SideSnap` に置かないのは、
   * 吸い付きを使う artboard の移動・リサイズに Alt / Option の距離を持ち込まないため。
   *
   * @param snap 寄せる前の運んでいるものと揃え先（吸い付かない回は揃え先が空）
   * @param distanceTargets 距離を測る相手。測らない回は `none`
   * @returns 寄せ量と、吸い付いた線・揃え先との隙間・距離（測らない回は全部 `none`）
   */
  toSnapped(
    snap: SideSnap,
    distanceTargets: Option<DistanceTargets>,
  ): RepositionSnapped {
    const snapped = SideSnap.toSnapped(snap);
    const distanceLines = Option.unwrapOr(
      Option.map(distanceTargets, (targets) =>
        FacingDistances.create({
          moved: SideSnap.movedBy(snap, snapped.offset),
          ...targets,
        }),
      ),
      FacingDistances.None,
    );
    return {
      offset: snapped.offset,
      lines: { snap: snapped.guides, distanceLines },
    };
  },

  /**
   * Alt / Option の距離のうち、揃え先との隙間が同じ線を既に出している向きを除いたもの
   * （docs/06-ui.md の Alt / Option の距離。同じ線と数値を 2 つ重ねない）。
   *
   * 除いた結果を持たずに毎回計算する。持つと、除く前と除いたあとが食い違う組が書ける。
   *
   * @param lines 運んでいる間に出す線
   * @returns 隙間と同じ線になる向きを `none` にした距離
   */
  distanceLinesExceptGaps(lines: RepositionLines): FacingDistances {
    return FacingDistances.fromFacings((facing) => {
      const gapLine = Option.flatMap(
        lines.snap[SidePair.perpendicular(facing.pair)],
        (guide) => guide.gapLine,
      );
      return Option.flatMap(
        lines.distanceLines[facing.pair][facing.end],
        (distanceLine) => {
          const isSameAsGap =
            Option.isSome(gapLine) &&
            ThinLine.equals(gapLine.value, distanceLine);
          return isSameAsGap ? Option.none : Option.some(distanceLine);
        },
      );
    });
  },
} as const;

import { Offset } from "@/domains/unit/offset";
import { DistanceTargets } from "@/features/editor/features/canvas/domains/distance-targets";
import { FacingDistances } from "@/features/editor/features/canvas/domains/facing-distances";
import {
  SideSnap,
  type SnapGuide,
  type SnapGuides,
} from "@/features/editor/features/canvas/domains/side-snap";
import { Option } from "@/utils/Option";

/**
 * ノードの座標の置き直しと artboard の移動で運んでいる間に出す線。吸い付いた線と揃え先との
 * 隙間（除く前）、Alt / Option の距離。すべて画面上の px。
 */
export type RepositionLines = Readonly<{
  snap: SnapGuides;
  distanceLines: FacingDistances;
}>;

/**
 * ノードの座標の置き直しと artboard の移動 1 回分の吸い付きの答え。
 */
export type RepositionSnapped = Readonly<{
  /** 寄せ量（画面上の px） */
  offset: Offset;
  lines: RepositionLines;
}>;

export const RepositionLines = {
  /** 寄せず、線も距離も出さない答え。 */
  Unsnapped: {
    offset: Offset.Origin,
    lines: { snap: SideSnap.NoGuides, distanceLines: FacingDistances.None },
  } satisfies RepositionSnapped,

  /**
   * 寄せ量と、寄せたあとの位置に出す線を 1 回の判定から作る。
   *
   * 寄せ量と線・距離を別々に作ると、離した位置と線がずれる。`SideSnap` に置かないのは、
   * 距離が吸い付きの性質ではないため（吸い付かない回（⌘ / Ctrl）にも測る。docs/06-ui.md の
   * Alt / Option の距離）。
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
        DistanceTargets.toDistances(
          targets,
          SideSnap.movedBy(snap, snapped.offset),
        ),
      ),
      FacingDistances.None,
    );
    return {
      offset: snapped.offset,
      lines: { snap: snapped.guides, distanceLines },
    };
  },

  /**
   * 揃え先とのガイドのうち、Alt / Option の距離と同じ線上に重なる隙間を除いたもの
   * （docs/06-ui.md の Alt / Option の距離）。ガイド線は残す。
   *
   * 比べるのは丸める前の距離の線。表示で丸めて消える距離（ドキュメント上で 0.5px 未満）でも、
   * 同じ線上に重なる隙間は除く。倍率を持たないので表示される数値を知らないため
   * （docs/06-ui.md の Alt / Option の距離の子項目）。
   *
   * 除いた結果を持たずに毎回計算する。持つと、除く前と除いたあとが食い違う組が書ける。
   *
   * @param lines 運んでいる間に出す線
   * @returns ガイド線は残し、Alt / Option の距離と同じ線上に重なる隙間（`gapLine`）を `none` にしたガイド
   */
  snapGuidesExceptCoincidingGaps(lines: RepositionLines): SnapGuides {
    const exceptCoinciding = (guide: SnapGuide): SnapGuide => ({
      guideLine: guide.guideLine,
      gapLine: Option.flatMap(guide.gapLine, (gapLine) =>
        FacingDistances.hasCoinciding(lines.distanceLines, gapLine)
          ? Option.none
          : Option.some(gapLine),
      ),
    });
    return {
      horizontal: Option.map(lines.snap.horizontal, exceptCoinciding),
      vertical: Option.map(lines.snap.vertical, exceptCoinciding),
    };
  },
} as const;

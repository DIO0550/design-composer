import type { ReactElement } from "react";
import { AxisEnds } from "@/domains/unit/axis";
import { SidePairs } from "@/domains/unit/side";
import type { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { DistanceReadout } from "@/features/editor/features/canvas/domains/distance-readout";
import type { FacingDistances } from "@/features/editor/features/canvas/domains/facing-distances";
import { Option } from "@/utils/Option";
import { DistanceLine } from "../snap-guide-overlay";

/**
 * Alt / Option の距離（運んでいる間と、選択しているだけのとき / docs/06-ui.md「キャンバス
 * 直接操作」）。見た目は揃え先との隙間と同じ。
 *
 * @returns 距離のある向きごとの短い線と数値。ドキュメント上の px へ丸めて 0 になる向きは出ない
 */
export function FacingDistanceOverlay({
  distances,
  view,
}: Readonly<{ distances: FacingDistances; view: CanvasView }>): ReactElement {
  const readouts = Object.values(SidePairs).flatMap((pair) =>
    Object.values(AxisEnds).flatMap((end) => {
      const readout = Option.flatMap(distances[pair][end], (line) =>
        DistanceReadout.create(line, view),
      );
      return Option.isSome(readout)
        ? [{ key: `${pair}-${end}`, readout: readout.value }]
        : [];
    }),
  );
  return (
    <>
      {readouts.map(({ key, readout }) => (
        <DistanceLine key={key} readout={readout} testId="facing-distance" />
      ))}
    </>
  );
}

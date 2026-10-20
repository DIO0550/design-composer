import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";

/** 揃え先の左辺（250）に中心を合わせた縦の線。左右の辺（水平の組）が揃った側。 */
export const VerticalLine: CanvasBounds = {
  left: 249,
  top: 150,
  width: 2,
  height: 90,
};

/** 揃え先の上辺（150）に中心を合わせた横の線。上下の辺（垂直の組）が揃った側。 */
export const HorizontalLine: CanvasBounds = {
  left: 200,
  top: 149,
  width: 120,
  height: 2,
};

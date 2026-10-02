import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";

/** 横に間隔 20 で並ぶ 2 つの左側（左右 0〜40・上下 0〜20）。 */
export const RowStart: CanvasBounds = {
  left: 0,
  top: 0,
  width: 40,
  height: 20,
};

/** 横に間隔 20 で並ぶ 2 つの右側（左右 60〜100・上下 0〜20）。 */
export const RowEnd: CanvasBounds = { left: 60, top: 0, width: 40, height: 20 };

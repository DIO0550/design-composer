import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";

/** 落とし先の親（左右 0〜200・上下 0〜100）。 */
export const Parent: CanvasBounds = {
  left: 0,
  top: 0,
  width: 200,
  height: 100,
};

/** 運んでいるもの（左右 50〜70・上下 40〜50）。 */
export const Moved: CanvasBounds = { left: 50, top: 40, width: 20, height: 10 };

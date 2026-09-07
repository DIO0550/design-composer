import type { CanvasBounds } from "@/features/canvas/domains/node-drop";

/**
 * 左 100・上 100 に置かれた、幅 40・高さ 20 の運んでいるもの。
 * 4 辺は 左 100 / 右 140 / 上 100 / 下 120。
 *
 * 縦横で幅を変えてあるのは、軸を取り違えた実装が同じ答えを出さないようにするため。
 */
export const Moving: CanvasBounds = {
  left: 100,
  top: 100,
  width: 40,
  height: 20,
};

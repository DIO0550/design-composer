import type { ValueOf } from "@/types/ValueOf";

/**
 * CSS ボックスの 4 辺。走査するときは `Object.values(Sides)` で並びにする。
 *
 * 並びは CSS の shorthand と同じ 上 右 下 左（docs/03「上 右 下 左 の順で4値に合成」）。
 */
export const Sides = {
  Top: "top",
  Right: "right",
  Bottom: "bottom",
  Left: "left",
} as const;

/** ボックスの 1 辺。 */
export type Side = ValueOf<typeof Sides>;

/** 向かい合う 2 辺の組。走査するときは `Object.values(SidePairs)` で並びにする。 */
export const SidePairs = {
  Vertical: "vertical",
  Horizontal: "horizontal",
} as const;

/**
 * 向かい合う 2 辺をひとまとめに指す向き。
 *
 * 大きさを測る軸（`css-direction` の `Axis`。`width` / `height`）とは別物で、
 * こちらが答えるのは「どの 2 辺が対になるか」だけ。
 */
export type SidePair = ValueOf<typeof SidePairs>;

export const SidePair = {
  /**
   * その組に属する 2 辺。
   *
   * 並びは `Sides` の宣言順（上 右 下 左）に従う。畳んだ欄と 4 辺の欄で
   * 辺の前後関係が入れ替わらないようにするため。
   *
   * @param pair 辺を知りたい組
   * @returns 垂直なら上・下、水平なら右・左
   */
  sides(pair: SidePair): readonly [Side, Side] {
    return pair === SidePairs.Vertical
      ? [Sides.Top, Sides.Bottom]
      : [Sides.Right, Sides.Left];
  },
} as const;

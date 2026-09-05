import type { Axis } from "@/domains/unit/axis";

/**
 * 平面上の位置、またはその差。
 * x と y は片方だけでは位置が決まらないため、対で 1 つの型にする。
 *
 * どこを原点とするかは持たない（画面の座標にも、親からの相対座標にも使う）。
 * 原点の意味は使う側が決める。
 */
export type Offset = Readonly<{ x: number; y: number }>;

export const Offset = {
  Origin: { x: 0, y: 0 },

  add(offset: Offset, delta: Offset): Offset {
    return { x: offset.x + delta.x, y: offset.y + delta.y };
  },

  /** `from` から `to` への差。 */
  delta(from: Offset, to: Offset): Offset {
    return { x: to.x - from.x, y: to.y - from.y };
  },

  /**
   * 各成分へ同じ係数を掛けた差。向きだけを表す差から、長さのある移動量を作るのに使う。
   *
   * @param offset 掛ける元の差
   * @param factor 掛ける係数
   * @returns 各成分を `factor` 倍した差
   */
  scale(offset: Offset, factor: number): Offset {
    return { x: offset.x * factor, y: offset.y * factor };
  },

  /** 軸に沿った成分。1 軸だけを見る操作（リサイズ）が使う。 */
  along(offset: Offset, axis: Axis): number {
    return axis === "width" ? offset.x : offset.y;
  },

  /** 2 点の直線距離。「どれだけ動いたか」を向きに依らず 1 つの値で見るために使う。 */
  distance(from: Offset, to: Offset): number {
    const delta = Offset.delta(from, to);
    return Math.hypot(delta.x, delta.y);
  },
} as const;

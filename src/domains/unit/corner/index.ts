import type { ValueOf } from "@/types/ValueOf";

/**
 * CSS ボックスの 4 隅。走査するときは `Object.values(Corners)` で並びにする。
 *
 * 並びは CSS の `border-radius` shorthand と同じ 左上 右上 右下 左下
 * （docs/03「左上 右上 右下 左下 の順で4値に合成」）。
 */
export const Corners = {
  TopLeft: "topLeft",
  TopRight: "topRight",
  BottomRight: "bottomRight",
  BottomLeft: "bottomLeft",
} as const;

/**
 * ボックスの 1 隅。
 *
 * 隅で引く操作は引かれる側が持つ（`unit/side` の `Side`・`unit/axis` の `Axis` と同じ形）。
 */
export type Corner = ValueOf<typeof Corners>;

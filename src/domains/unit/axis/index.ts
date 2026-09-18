import type { ValueOf } from "@/types/ValueOf";

/**
 * 大きさを測る 2 つの向き。走査するときは `Object.values(Axes)` で並びにする。
 *
 * 値はドキュメントの語彙ではなく CSS のプロパティ名と同じ綴りだが、これは
 * 「幅・高さ」という長さの向きそのものを指しているだけで、`.dcmp` の中身には
 * 依らない（`unit/side` の 4 辺と同じ位置づけ）。
 */
export const Axes = {
  Width: "width",
  Height: "height",
} as const;

/**
 * 大きさを測る向き。
 *
 * 軸で引く操作は引かれる側（`Offset.along` / `AxisLength`）が持つ（`unit/side` の `Side`
 * も同じ形）。
 */
export type Axis = ValueOf<typeof Axes>;

/**
 * 軸の 2 つの端。走査するときは `Object.values(AxisEnds)` で並びにする。
 *
 * 軸が決まったあとの残りだけを表す。軸と組み合わせて初めて 4 辺のどれか（`unit/side` の
 * `Side`）になるので、軸が既に分かっている文脈では端だけを持てば足りる。
 */
export const AxisEnds = {
  Start: "start",
  End: "end",
} as const;

/**
 * 軸の始点側か終点側か。横なら左 / 右、縦なら上 / 下に当たる。
 *
 * どの辺を指すかは軸と対にして引く（`CanvasBounds.edgeAt`）。
 */
export type AxisEnd = ValueOf<typeof AxisEnds>;

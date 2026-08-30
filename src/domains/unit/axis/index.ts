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

/** 大きさを測る向き。 */
export type Axis = ValueOf<typeof Axes>;

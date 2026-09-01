import { expect, test } from "vitest";
import { CanvasBounds } from "../index";

/** 左 10・上 20 に置かれた、幅 100・高さ 40 の矩形。 */
const Bounds: CanvasBounds = { left: 10, top: 20, width: 100, height: 40 };

test("横に並ぶときの始点は左端になる", () => {
  expect(CanvasBounds.start(Bounds, "row")).toBe(10);
});

test("横に並ぶときの終点は右端になる", () => {
  expect(CanvasBounds.end(Bounds, "row")).toBe(110);
});

test("縦に並ぶときの始点は上端になる", () => {
  expect(CanvasBounds.start(Bounds, "column")).toBe(20);
});

test("縦に並ぶときの終点は下端になる", () => {
  expect(CanvasBounds.end(Bounds, "column")).toBe(60);
});

test("横に並ぶときの中点は左右の端の中央になる", () => {
  expect(CanvasBounds.center(Bounds, "row")).toBe(60);
});

test("縦に並ぶときの中点は上下の端の中央になる", () => {
  expect(CanvasBounds.center(Bounds, "column")).toBe(40);
});

test("同じ位置と大きさなら、別に作った矩形どうしでも等しい", () => {
  // 実測のたびに新しいオブジェクトになるので、参照が違っても等しくなければならない
  expect(
    CanvasBounds.equals(Bounds, { left: 10, top: 20, width: 100, height: 40 }),
  ).toBe(true);
});

test("4 つの値のどれか 1 つでも違えば等しくない", () => {
  const differing = [
    { ...Bounds, left: 11 },
    { ...Bounds, top: 21 },
    { ...Bounds, width: 101 },
    { ...Bounds, height: 41 },
  ];

  expect(differing.map((other) => CanvasBounds.equals(Bounds, other))).toEqual([
    false,
    false,
    false,
    false,
  ]);
});

test("別の矩形の左上を原点に置き直すと、左上だけがその差だけずれる", () => {
  // 大きさは器に依らないので変わらない
  const origin: CanvasBounds = { left: 4, top: 6, width: 500, height: 500 };

  expect(CanvasBounds.relativeTo(Bounds, origin)).toEqual({
    left: 6,
    top: 14,
    width: 100,
    height: 40,
  });
});

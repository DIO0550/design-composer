import { expect, test } from "vitest";
import { CanvasBounds } from "../index";

/** 左 10・上 20 に置かれた、幅 100・高さ 40 の矩形。 */
const BOUNDS: CanvasBounds = { left: 10, top: 20, width: 100, height: 40 };

test("横に並ぶときの始点は左端になる", () => {
  expect(CanvasBounds.start(BOUNDS, "row")).toBe(10);
});

test("横に並ぶときの終点は右端になる", () => {
  expect(CanvasBounds.end(BOUNDS, "row")).toBe(110);
});

test("縦に並ぶときの始点は上端になる", () => {
  expect(CanvasBounds.start(BOUNDS, "column")).toBe(20);
});

test("縦に並ぶときの終点は下端になる", () => {
  expect(CanvasBounds.end(BOUNDS, "column")).toBe(60);
});

test("横に並ぶときの中点は左右の端の中央になる", () => {
  expect(CanvasBounds.center(BOUNDS, "row")).toBe(60);
});

test("縦に並ぶときの中点は上下の端の中央になる", () => {
  expect(CanvasBounds.center(BOUNDS, "column")).toBe(40);
});

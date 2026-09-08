import { expect, test } from "vitest";
import { CanvasBounds } from "..";

/** 左上 (100, 60)・幅 80・高さ 50 の矩形。重なりを見る相手の基準。 */
const Bounds: CanvasBounds = { left: 100, top: 60, width: 80, height: 50 };

test("2 点を対角にすると、その 2 点をちょうど囲む矩形になる", () => {
  expect(CanvasBounds.spanning({ x: 100, y: 60 }, { x: 180, y: 110 })).toEqual(
    Bounds,
  );
});

test("2 点の順が逆でも、幅と高さは正のまま同じ矩形になる", () => {
  expect(CanvasBounds.spanning({ x: 180, y: 110 }, { x: 100, y: 60 })).toEqual(
    Bounds,
  );
});

test("一部が重なっている矩形は重なりとみなす", () => {
  const overlapping: CanvasBounds = {
    left: 170,
    top: 100,
    width: 40,
    height: 30,
  };

  expect(CanvasBounds.overlaps(Bounds, overlapping)).toBe(true);
});

test("内側にすっぽり入っている矩形も重なりとみなす", () => {
  const inside: CanvasBounds = { left: 120, top: 70, width: 10, height: 10 };

  expect(CanvasBounds.overlaps(Bounds, inside)).toBe(true);
});

test("辺が接するだけの矩形も重なりとみなす", () => {
  // 左辺が Bounds の右辺（180）にちょうど乗っている
  const touching: CanvasBounds = { left: 180, top: 60, width: 40, height: 50 };

  expect(CanvasBounds.overlaps(Bounds, touching)).toBe(true);
});

test("横に離れている矩形は重なりではない", () => {
  const apart: CanvasBounds = { left: 181, top: 60, width: 40, height: 50 };

  expect(CanvasBounds.overlaps(Bounds, apart)).toBe(false);
});

test("縦に離れている矩形は重なりではない", () => {
  // 横は重なっているので、縦を見ていなければ通ってしまう
  const apart: CanvasBounds = { left: 100, top: 111, width: 80, height: 50 };

  expect(CanvasBounds.overlaps(Bounds, apart)).toBe(false);
});

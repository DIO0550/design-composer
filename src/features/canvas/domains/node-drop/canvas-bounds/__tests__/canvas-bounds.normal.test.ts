import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
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

test("別の矩形の左上から見たずれは、左上どうしの差になる", () => {
  // 縦横で符号を違える（取り違えても片方だけでは落ちないため）
  const shift = CanvasBounds.originShift(Bounds, {
    left: 30,
    top: 5,
    width: 200,
    height: 80,
  });

  expect(shift).toEqual({ x: -20, y: 15 });
});

test("幅も高さも正なら面積を持つ", () => {
  expect(CanvasBounds.hasArea(Bounds)).toBe(true);
});

test("幅か高さのどちらかが 0 なら面積を持たない", () => {
  // 実測は描かれる前や器が畳まれているときに 0 を返すので、片方だけ 0 も起きる
  const flattened = [
    { ...Bounds, width: 0 },
    { ...Bounds, height: 0 },
  ];

  expect(flattened.map((bounds) => CanvasBounds.hasArea(bounds))).toEqual([
    false,
    false,
  ]);
});

test("並び全体を含む最小の矩形は、四辺のいちばん外側で決まる", () => {
  // 左端は 2 つ目、上端と右端は 1 つ目、下端は 2 つ目が決める（1 つの矩形からは決まらない）
  const spread: readonly CanvasBounds[] = [
    { left: 10, top: 20, width: 100, height: 40 },
    { left: 4, top: 50, width: 30, height: 60 },
  ];

  expect(CanvasBounds.enclosing(spread)).toEqual(
    Option.some({ left: 4, top: 20, width: 106, height: 90 }),
  );
});

test("矩形が 1 つだけなら、その矩形がそのまま全体になる", () => {
  expect(CanvasBounds.enclosing([Bounds])).toEqual(Option.some(Bounds));
});

test("囲む矩形が 1 つも無ければ全体は決まらない", () => {
  expect(CanvasBounds.enclosing([])).toEqual(Option.none);
});

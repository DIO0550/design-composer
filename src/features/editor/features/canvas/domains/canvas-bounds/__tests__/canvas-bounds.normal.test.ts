import { expect, test } from "vitest";
import { SidePairs } from "@/domains/unit/side";
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

test("水平の組の中心線は、左右の辺の中央になる", () => {
  expect(CanvasBounds.midline(Bounds, SidePairs.Horizontal)).toBe(60);
});

test("垂直の組の中心線は、上下の辺の中央になる", () => {
  expect(CanvasBounds.midline(Bounds, SidePairs.Vertical)).toBe(40);
});

test("水平の組の範囲は、左辺から右辺までになる", () => {
  expect(CanvasBounds.extentAlong(Bounds, SidePairs.Horizontal)).toEqual({
    min: 10,
    max: 110,
  });
});

test("垂直の組の範囲は、上辺から下辺までになる", () => {
  expect(CanvasBounds.extentAlong(Bounds, SidePairs.Vertical)).toEqual({
    min: 20,
    max: 60,
  });
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

/**
 * 左端は 2 つ目、上端と右端は 1 つ目、下端は 2 つ目が決める並び（1 つの矩形からは
 * 全体が決まらない）。
 */
const Spread: readonly [CanvasBounds, CanvasBounds] = [
  { left: 10, top: 20, width: 100, height: 40 },
  { left: 4, top: 50, width: 30, height: 60 },
];

test("並び全体を含む最小の矩形は、四辺のいちばん外側で決まる", () => {
  expect(CanvasBounds.enclosing(Spread)).toEqual(
    Option.some({ left: 4, top: 20, width: 106, height: 90 }),
  );
});

test("矩形が 1 つだけなら、その矩形がそのまま全体になる", () => {
  expect(CanvasBounds.enclosing([Bounds])).toEqual(Option.some(Bounds));
});

test("囲む矩形が 1 つも無ければ全体は決まらない", () => {
  expect(CanvasBounds.enclosing([])).toEqual(Option.none);
});

test("1 つ以上ある矩形をすべて含む最小の矩形は、空になりえないので必ず決まる", () => {
  expect(CanvasBounds.enclosingAll(Spread)).toEqual({
    left: 4,
    top: 20,
    width: 106,
    height: 90,
  });
});

test("比率 (0, 0) は矩形の左上、(1, 1) は右下を指す", () => {
  expect([
    CanvasBounds.pointAt(Bounds, { x: 0, y: 0 }),
    CanvasBounds.pointAt(Bounds, { x: 1, y: 1 }),
  ]).toEqual([
    { x: 10, y: 20 },
    { x: 110, y: 60 },
  ]);
});

test("比率は幅と高さのそれぞれに掛かる", () => {
  // 縦横で違う比率を渡す（取り違えても同じ値だと落ちないため）
  expect(CanvasBounds.pointAt(Bounds, { x: 0.5, y: 0.25 })).toEqual({
    x: 60,
    y: 30,
  });
});

test("矩形をずらすと、位置だけが動いて大きさは変わらない", () => {
  // 縦横で違う量を渡す（取り違えても同じ値だと落ちないため）
  expect(CanvasBounds.movedBy(Bounds, { x: 5, y: -3 })).toEqual({
    left: 15,
    top: 17,
    width: 100,
    height: 40,
  });
});

test("4 辺のうち指定した辺の座標が返る", () => {
  expect([
    CanvasBounds.side(Bounds, "left"),
    CanvasBounds.side(Bounds, "right"),
    CanvasBounds.side(Bounds, "top"),
    CanvasBounds.side(Bounds, "bottom"),
  ]).toEqual([10, 110, 20, 60]);
});

test("横に並ぶときの交差軸の範囲は上端から下端までになる", () => {
  expect(CanvasBounds.crossExtent(Bounds, "row")).toEqual({ min: 20, max: 60 });
});

test("縦に並ぶときの交差軸の範囲は左端から右端までになる", () => {
  expect(CanvasBounds.crossExtent(Bounds, "column")).toEqual({
    min: 10,
    max: 110,
  });
});

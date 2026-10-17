import { expect, test } from "vitest";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { RotatedBounds } from "../index";

/** 画面の (100, 50) から 200x100 の、正方形でない矩形。中心は (200, 100)。 */
const Unrotated: CanvasBounds = { left: 100, top: 50, width: 200, height: 100 };

test("回っていなければ、左上の箇所は矩形の左上に描かれる", () => {
  const bounds = { unrotated: Unrotated, rotation: 0 };

  expect(RotatedBounds.pointAt(bounds, { x: 0, y: 0 })).toEqual({
    x: 100,
    y: 50,
  });
});

test("回っていなければ、右辺の中点の箇所は矩形の右辺の中点に描かれる", () => {
  const bounds = { unrotated: Unrotated, rotation: 0 };

  expect(RotatedBounds.pointAt(bounds, { x: 1, y: 0.5 })).toEqual({
    x: 300,
    y: 100,
  });
});

test("回っていなければ、端数を持つ矩形でも左上の箇所は矩形の左上そのものに描かれる", () => {
  // 中心を経由して戻すと (l - cx) + cx が l に戻らない端数が出る
  const unrotated = { left: 1.89, top: 0.1, width: 196.72, height: 0.7 };

  expect(
    RotatedBounds.pointAt({ unrotated, rotation: 0 }, { x: 0, y: 0 }),
  ).toEqual({ x: 1.89, y: 0.1 });
});

test("90 度回すと、左上の箇所は中心から見て右上へ来る", () => {
  const point = RotatedBounds.pointAt(
    { unrotated: Unrotated, rotation: 90 },
    { x: 0, y: 0 },
  );

  expect(point.x).toBeCloseTo(250);
  expect(point.y).toBeCloseTo(0);
});

test("30 度回すと、右下の箇所は中心まわりに時計回りへ 30 度動いた位置に描かれる", () => {
  const point = RotatedBounds.pointAt(
    { unrotated: Unrotated, rotation: 30 },
    { x: 1, y: 1 },
  );

  expect(point.x).toBeCloseTo(261.6, 1);
  expect(point.y).toBeCloseTo(193.3, 1);
});

test("回って描かれた箇所を戻すと、回る前の矩形の上の位置になる", () => {
  const bounds = { unrotated: Unrotated, rotation: 30 };
  const drawn = RotatedBounds.pointAt(bounds, { x: 1, y: 0.5 });

  const unrotated = RotatedBounds.unrotatePoint(bounds, drawn);

  expect(unrotated.x).toBeCloseTo(300);
  expect(unrotated.y).toBeCloseTo(100);
});

test("外接矩形と回る前の大きさからは、外接矩形と同じ中心の矩形ができる", () => {
  const bounds = RotatedBounds.fromEnclosing(
    { left: 100, top: 40, width: 220, height: 120 },
    { width: 200, height: 100 },
    30,
  );

  expect(bounds.unrotated).toEqual({
    left: 110,
    top: 50,
    width: 200,
    height: 100,
  });
});

test("回る前の大きさが外接矩形と同じなら、回る前の矩形は外接矩形そのもの", () => {
  const enclosing = { left: 100.3, top: 50.7, width: 200.1, height: 99.9 };

  const bounds = RotatedBounds.fromEnclosing(enclosing, enclosing, 0);

  expect(bounds.unrotated).toEqual(enclosing);
});

test("器の左上を原点に置き直しても、向きは変わらない", () => {
  const bounds = RotatedBounds.relativeTo(
    { unrotated: Unrotated, rotation: 30 },
    { left: 40, top: 20, width: 800, height: 600 },
  );

  expect(bounds).toEqual({
    unrotated: { left: 60, top: 30, width: 200, height: 100 },
    rotation: 30,
  });
});

test("向きだけが違う 2 つは同じ矩形とみなさない", () => {
  expect(
    RotatedBounds.equals(
      { unrotated: Unrotated, rotation: 30 },
      { unrotated: Unrotated, rotation: 45 },
    ),
  ).toBe(false);
});

test("90 度回した横長の矩形の外接矩形は、中心が同じ縦長の矩形になる", () => {
  const enclosing = RotatedBounds.toEnclosing({
    unrotated: Unrotated,
    rotation: 90,
  });

  expect(enclosing.left).toBeCloseTo(150);
  expect(enclosing.top).toBeCloseTo(0);
  expect(enclosing.width).toBeCloseTo(100);
  expect(enclosing.height).toBeCloseTo(200);
});

test("回っていなければ、端数を持つ矩形の外接矩形はその矩形そのもの", () => {
  const unrotated = { left: 1.89, top: 0.1, width: 196.72, height: 0.7 };

  expect(RotatedBounds.toEnclosing({ unrotated, rotation: 0 })).toEqual(
    unrotated,
  );
});

test("360 度回した矩形の外接矩形は、回る前の矩形そのもの", () => {
  const unrotated = { left: 1.89, top: 0.1, width: 196.72, height: 0.7 };

  expect(RotatedBounds.toEnclosing({ unrotated, rotation: 360 })).toEqual(
    unrotated,
  );
});

test("30 度回した矩形の外接矩形は、回った 4 角がちょうど収まる大きさになる", () => {
  // 幅 200·cos30 + 100·sin30、高さ 200·sin30 + 100·cos30 を、中心 (200, 100) に置いたもの
  const enclosing = RotatedBounds.toEnclosing({
    unrotated: Unrotated,
    rotation: 30,
  });

  expect(enclosing.left).toBeCloseTo(88.397, 3);
  expect(enclosing.top).toBeCloseTo(6.699, 3);
  expect(enclosing.width).toBeCloseTo(223.205, 3);
  expect(enclosing.height).toBeCloseTo(186.603, 3);
});

test("親の中の位置へ置き直すと、回る前の矩形の左上がその位置に来て大きさと向きは変わらない", () => {
  const placed = RotatedBounds.placedAt(
    { unrotated: Unrotated, rotation: 30 },
    { left: 10, top: 20, width: 400, height: 300 },
    { x: 5, y: 7 },
  );

  expect(placed).toEqual({
    unrotated: { left: 15, top: 27, width: 200, height: 100 },
    rotation: 30,
  });
});

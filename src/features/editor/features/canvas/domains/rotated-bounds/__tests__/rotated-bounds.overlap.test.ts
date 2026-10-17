import { expect, test } from "vitest";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { RotatedBounds } from "../index";

/** 回る前は (150, 100) から 100x100、中心 (200, 150) を軸に 45 度回した正方形。 */
const TurnedSquare: RotatedBounds = {
  unrotated: { left: 150, top: 100, width: 100, height: 100 },
  rotation: 45,
};

/** 回る前は (100, 50) から 200x100 の横長を 90 度回したもの。回った後は x 150〜250・y 0〜200。 */
const QuarterTurnedWide: RotatedBounds = {
  unrotated: { left: 100, top: 50, width: 200, height: 100 },
  rotation: 90,
};

test("45 度回した矩形は、外接矩形の隅にだけかかる矩形とは重ならない", () => {
  expect(
    RotatedBounds.overlaps(
      TurnedSquare,
      CanvasBounds.spanning({ x: 60, y: 40 }, { x: 150, y: 100 }),
    ),
  ).toBe(false);
});

test("45 度回した矩形は、回った辺の内側まで入る矩形と重なる", () => {
  expect(
    RotatedBounds.overlaps(
      TurnedSquare,
      CanvasBounds.spanning({ x: 60, y: 40 }, { x: 180, y: 130 }),
    ),
  ).toBe(true);
});

test("45 度回した矩形は、角の外側で外接矩形にも届かない矩形とは重ならない", () => {
  expect(
    RotatedBounds.overlaps(TurnedSquare, {
      left: 100,
      top: 140,
      width: 20,
      height: 20,
    }),
  ).toBe(false);
});

test("回った矩形の中にすっぽり入る矩形と重なる", () => {
  expect(
    RotatedBounds.overlaps(
      TurnedSquare,
      CanvasBounds.spanning({ x: 195, y: 145 }, { x: 205, y: 155 }),
    ),
  ).toBe(true);
});

test("回った矩形をすっぽり覆う矩形と重なる", () => {
  expect(
    RotatedBounds.overlaps(
      TurnedSquare,
      CanvasBounds.spanning({ x: 0, y: 0 }, { x: 400, y: 400 }),
    ),
  ).toBe(true);
});

test("90 度回した横長は、回る前の左端があった位置の矩形とは重ならない", () => {
  expect(
    RotatedBounds.overlaps(QuarterTurnedWide, {
      left: 100,
      top: 90,
      width: 40,
      height: 20,
    }),
  ).toBe(false);
});

test("90 度回した横長は、互いの角がどちらの内側にも無い十字の交差でも重なる", () => {
  expect(
    RotatedBounds.overlaps(QuarterTurnedWide, {
      left: 100,
      top: 90,
      width: 200,
      height: 20,
    }),
  ).toBe(true);
});

test("回っていなければ、辺が接するだけでも重なりとみなす", () => {
  const bounds = {
    unrotated: { left: 100, top: 50, width: 200, height: 100 },
    rotation: 0,
  };

  expect(
    RotatedBounds.overlaps(
      bounds,
      CanvasBounds.spanning({ x: 300, y: 50 }, { x: 320, y: 150 }),
    ),
  ).toBe(true);
});

test("1 回り回したものも、辺が接するだけで重なりとみなす", () => {
  const bounds = {
    unrotated: { left: 100, top: 50, width: 200, height: 100 },
    rotation: 360,
  };

  expect(
    RotatedBounds.overlaps(
      bounds,
      CanvasBounds.spanning({ x: 300, y: 50 }, { x: 320, y: 150 }),
    ),
  ).toBe(true);
});

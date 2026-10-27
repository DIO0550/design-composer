import { expect, test } from "vitest";
import { SidePairs } from "@/domains/unit/side";
import { ThinLine } from "../index";

test("縦に伸びる線は、中心を位置に合わせた幅 2 の矩形になる", () => {
  expect(
    ThinLine.toBounds({
      along: SidePairs.Vertical,
      at: 260,
      span: { min: 176, max: 240 },
    }),
  ).toEqual({ left: 259, top: 176, width: 2, height: 64 });
});

test("横に伸びる線は、中心を位置に合わせた高さ 2 の矩形になる", () => {
  expect(
    ThinLine.toBounds({
      along: SidePairs.Horizontal,
      at: 160,
      span: { min: 272, max: 320 },
    }),
  ).toEqual({ left: 272, top: 159, width: 48, height: 2 });
});

test("向き・位置・範囲がすべて同じ線は等しい", () => {
  expect(
    ThinLine.equals(
      { along: SidePairs.Vertical, at: 60, span: { min: 20, max: 60 } },
      { along: SidePairs.Vertical, at: 60, span: { min: 20, max: 60 } },
    ),
  ).toBe(true);
});

test("位置だけ違う線は等しくない", () => {
  expect(
    ThinLine.equals(
      { along: SidePairs.Vertical, at: 60, span: { min: 20, max: 60 } },
      { along: SidePairs.Vertical, at: 61, span: { min: 20, max: 60 } },
    ),
  ).toBe(false);
});

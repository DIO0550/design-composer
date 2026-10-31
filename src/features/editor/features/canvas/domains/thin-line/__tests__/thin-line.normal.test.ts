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

test("同じ向きで範囲が重なり、位置の差がちょうど 8px なら、同じ線上に重なる", () => {
  expect(
    ThinLine.isCoinciding(
      { along: SidePairs.Vertical, at: 60, span: { min: 20, max: 60 } },
      { along: SidePairs.Vertical, at: 68, span: { min: 20, max: 30 } },
    ),
  ).toBe(true);
});

test("位置の差が 8.5px なら、同じ線上に重ならない", () => {
  expect(
    ThinLine.isCoinciding(
      { along: SidePairs.Vertical, at: 60, span: { min: 20, max: 60 } },
      { along: SidePairs.Vertical, at: 68.5, span: { min: 20, max: 30 } },
    ),
  ).toBe(false);
});

test("位置の大小を入れ替えても答えは同じ", () => {
  expect(
    ThinLine.isCoinciding(
      { along: SidePairs.Vertical, at: 68, span: { min: 20, max: 30 } },
      { along: SidePairs.Vertical, at: 60, span: { min: 20, max: 60 } },
    ),
  ).toBe(true);
});

test("向きが違う線は、位置の差が 0 で範囲が重なっていても、同じ線上に重ならない", () => {
  expect(
    ThinLine.isCoinciding(
      { along: SidePairs.Vertical, at: 60, span: { min: 20, max: 60 } },
      { along: SidePairs.Horizontal, at: 60, span: { min: 20, max: 60 } },
    ),
  ).toBe(false);
});

test("範囲が端で接するだけなら、位置の差が 0 でも、同じ線上に重ならない", () => {
  expect(
    ThinLine.isCoinciding(
      { along: SidePairs.Vertical, at: 60, span: { min: 20, max: 60 } },
      { along: SidePairs.Vertical, at: 60, span: { min: 60, max: 80 } },
    ),
  ).toBe(false);
});

test("範囲が離れていれば、位置の差が 0 でも、同じ線上に重ならない", () => {
  expect(
    ThinLine.isCoinciding(
      { along: SidePairs.Vertical, at: 60, span: { min: 20, max: 60 } },
      { along: SidePairs.Vertical, at: 60, span: { min: 70, max: 80 } },
    ),
  ).toBe(false);
});

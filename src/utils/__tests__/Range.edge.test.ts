import { expect, test } from "vitest";
import { Option } from "../Option";
import { Range } from "../Range";

test("重なっている 2 つの範囲には、間が無い", () => {
  expect(Range.gapBetween({ min: 0, max: 20 }, { min: 15, max: 40 })).toEqual(
    Option.none,
  );
});

test("端が接するだけの 2 つの範囲にも、間は無い", () => {
  // 長さ 0 の間を返すと、接しているだけの 2 つを離れているものとして扱う
  expect(Range.gapBetween({ min: 0, max: 20 }, { min: 20, max: 40 })).toEqual(
    Option.none,
  );
});

import { expect, test } from "vitest";
import { AxisLength } from "../index";

test("長さは px 未満を落とした整数になる", () => {
  expect(AxisLength.create("width", 120.4)).toEqual({
    axis: "width",
    length: 120,
  });
});

test("長さは四捨五入で近い方の px になる", () => {
  expect(AxisLength.create("height", 119.5)).toEqual({
    axis: "height",
    length: 120,
  });
});

test("負の長さを渡しても 0 より小さくはならない", () => {
  expect(AxisLength.create("width", -40)).toEqual({ axis: "width", length: 0 });
});

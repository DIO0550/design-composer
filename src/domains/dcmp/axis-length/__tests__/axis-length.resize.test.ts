import { expect, test } from "vitest";
import { Axes } from "@/domains/unit/axis";
import { Option } from "@/utils/Option";
import { AxisResize } from "../index";

test("前後の長さが違えば長さの変化になる", () => {
  expect(
    Option.unwrap(
      AxisResize.create({ axis: Axes.Width, before: 200, after: 300 }),
    ),
  ).toEqual({ axis: Axes.Width, before: 200, after: 300 });
});

test("前後の長さが同じなら長さは変わっていない", () => {
  expect(
    AxisResize.create({ axis: Axes.Height, before: 200, after: 200 }).some,
  ).toBe(false);
});

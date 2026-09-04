import { expect, test } from "vitest";
import { Constraints } from "@/domains/dcmp/constraint";
import { Axes } from "@/domains/unit/axis";
import { Option } from "@/utils/Option";
import { type AbsolutePlacement, Placement } from "../index";

/** 座標 (40, 24) に置かれた子。追従で動く前の位置として使う。 */
function setupPlacement(): AbsolutePlacement {
  return { mode: "absolute", x: 40, y: 24 };
}

test("横の追従は x の編集になる", () => {
  expect(
    Option.unwrap(
      Placement.followPropEdit(setupPlacement(), Constraints.Max, {
        axis: Axes.Width,
        before: 200,
        after: 300,
      }),
    ),
  ).toEqual({ names: ["x"], value: Option.some(140) });
});

test("縦の追従は y の編集になる", () => {
  expect(
    Option.unwrap(
      Placement.followPropEdit(setupPlacement(), Constraints.Max, {
        axis: Axes.Height,
        before: 100,
        after: 160,
      }),
    ),
  ).toEqual({ names: ["y"], value: Option.some(84) });
});

test("位置が変わらない追従では編集を出さない", () => {
  expect(
    Placement.followPropEdit(setupPlacement(), Constraints.Min, {
      axis: Axes.Width,
      before: 200,
      after: 300,
    }).some,
  ).toBe(false);
});

test("追従した位置は整数へ丸める", () => {
  expect(
    Option.unwrap(
      Placement.followPropEdit(setupPlacement(), Constraints.Center, {
        axis: Axes.Width,
        before: 200,
        after: 275,
      }),
    ),
  ).toEqual({ names: ["x"], value: Option.some(78) });
});

test("追従した位置は 0 より小さくなれる", () => {
  expect(
    Option.unwrap(
      Placement.followPropEdit(setupPlacement(), Constraints.Max, {
        axis: Axes.Width,
        before: 300,
        after: 200,
      }),
    ),
  ).toEqual({ names: ["x"], value: Option.some(-60) });
});

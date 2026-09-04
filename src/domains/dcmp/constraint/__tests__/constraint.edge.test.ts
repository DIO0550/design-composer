import { expect, test } from "vitest";
import { Axes } from "@/domains/unit/axis";
import { Constraint, Constraints } from "../index";

test("親が縮むと max の子は縮んだ分だけ戻る", () => {
  expect(
    Constraint.offsetAfter(Constraints.Max, 140, {
      axis: Axes.Width,
      before: 300,
      after: 200,
    }),
  ).toBe(40);
});

test("親が縮んで右辺を追い越すと max の子の位置は負になる", () => {
  expect(
    Constraint.offsetAfter(Constraints.Max, 40, {
      axis: Axes.Width,
      before: 300,
      after: 200,
    }),
  ).toBe(-60);
});

test("親が縮むと stretch の子は縮んだ分だけ短くなる", () => {
  expect(
    Constraint.lengthAfter(Constraints.Stretch, 180, {
      axis: Axes.Width,
      before: 300,
      after: 200,
    }),
  ).toBe(80);
});

test("変更前の長さが 0 の親では scale の子の位置が変わらない", () => {
  expect(
    Constraint.offsetAfter(Constraints.Scale, 40, {
      axis: Axes.Width,
      before: 0,
      after: 200,
    }),
  ).toBe(40);
});

test("変更前の長さが 0 の親では scale の子の長さが変わらない", () => {
  expect(
    Constraint.lengthAfter(Constraints.Scale, 80, {
      axis: Axes.Width,
      before: 0,
      after: 200,
    }),
  ).toBe(80);
});

test("語彙にない綴りは追従の仕方として読めない", () => {
  expect(Constraint.fromProps({ constraintX: "left" }, Axes.Width).some).toBe(
    false,
  );
});

test("追従の指定が無い props からは追従の仕方を読めない", () => {
  expect(Constraint.fromProps({ placement: "absolute" }, Axes.Width).some).toBe(
    false,
  );
});

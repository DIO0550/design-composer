import { expect, test } from "vitest";
import { SidePair, SidePairs, Sides } from "../index";

test("垂直の組の辺は上 下の順で得られる", () => {
  expect(SidePair.sides(SidePairs.Vertical)).toEqual([Sides.Top, Sides.Bottom]);
});

test("水平の組の辺は右 左の順で得られる", () => {
  expect(SidePair.sides(SidePairs.Horizontal)).toEqual([
    Sides.Right,
    Sides.Left,
  ]);
});

test("4 辺はどちらかの組にちょうど 1 度ずつ現れる", () => {
  const paired = Object.values(SidePairs).flatMap((pair) =>
    SidePair.sides(pair),
  );

  expect([...paired].sort()).toEqual(Object.values(Sides).sort());
});

import { expect, test } from "vitest";
import { ChildPlacement } from "../index";

test("親の名前とその親から見た座標を対にして持つ", () => {
  const placed = ChildPlacement.create("card", {
    mode: "absolute",
    x: 40,
    y: 24,
  });

  expect(placed).toEqual({
    parentName: "card",
    placement: { mode: "absolute", x: 40, y: 24 },
  });
});

test("同じ親を指しているときは、その親を持つと答える", () => {
  const placed = ChildPlacement.create("card", {
    mode: "absolute",
    x: 40,
    y: 24,
  });

  expect(ChildPlacement.hasParent(placed, "card")).toBe(true);
});

test("別の親を指しているときは、その親を持つと答えない", () => {
  const placed = ChildPlacement.create("card", {
    mode: "absolute",
    x: 40,
    y: 24,
  });

  expect(ChildPlacement.hasParent(placed, "home")).toBe(false);
});

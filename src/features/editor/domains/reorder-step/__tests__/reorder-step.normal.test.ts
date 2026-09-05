import { expect, test } from "vitest";
import { ReorderStep, ReorderSteps } from "../index";

test("前面へ 1 つ動かす先は、今いる位置の 1 つ後ろになる", () => {
  expect(
    ReorderStep.toIndex(ReorderSteps.TowardFront, {
      parentName: "Card",
      index: 1,
    }),
  ).toBe(2);
});

test("背面へ 1 つ動かす先は、今いる位置の 1 つ前になる", () => {
  expect(
    ReorderStep.toIndex(ReorderSteps.TowardBack, {
      parentName: "Card",
      index: 1,
    }),
  ).toBe(0);
});

test("並びの外へ出る先も、そのまま返す", () => {
  expect(
    ReorderStep.toIndex(ReorderSteps.TowardBack, {
      parentName: "Card",
      index: 0,
    }),
  ).toBe(-1);
});

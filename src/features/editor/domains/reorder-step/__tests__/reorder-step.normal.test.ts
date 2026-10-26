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

test("兄弟をまとめて前面へ動かすときは、前面にいるものから順に 1 つ後ろへ動かす", () => {
  expect(
    ReorderStep.toChildReorders(ReorderSteps.TowardFront, {
      parentName: "Card",
      indices: [0, 2],
    }),
  ).toEqual([
    { from: { parentName: "Card", index: 2 }, toIndex: 3 },
    { from: { parentName: "Card", index: 0 }, toIndex: 1 },
  ]);
});

test("兄弟をまとめて背面へ動かすときは、背面にいるものから順に 1 つ前へ動かす", () => {
  expect(
    ReorderStep.toChildReorders(ReorderSteps.TowardBack, {
      parentName: "Card",
      indices: [1, 3],
    }),
  ).toEqual([
    { from: { parentName: "Card", index: 1 }, toIndex: 0 },
    { from: { parentName: "Card", index: 3 }, toIndex: 2 },
  ]);
});

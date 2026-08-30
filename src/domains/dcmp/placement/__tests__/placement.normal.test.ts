import { expect, test } from "vitest";
import { Placement } from "../index";

test("flow を指定するとフローの配置になる", () => {
  expect(Placement.create("flow", 40, 24)).toEqual({ mode: "flow" });
});

test("absolute と座標を指定すると絶対配置になる", () => {
  expect(Placement.create("absolute", 40, 24)).toEqual({
    mode: "absolute",
    x: 40,
    y: 24,
  });
});

test("絶対配置は横の座標を left に、縦の座標を top に出す", () => {
  expect(Placement.declarations(Placement.create("absolute", 40, 24))).toEqual([
    { property: "position", value: "absolute" },
    { property: "left", value: "40px" },
    { property: "top", value: "24px" },
  ]);
});

test("フローの配置は宣言を出さない", () => {
  expect(Placement.declarations(Placement.create("flow", 40, 24))).toEqual([]);
});

test("フローに参加している配置は絶対配置ではない", () => {
  expect(Placement.isAbsolute(Placement.create("flow", 40, 24))).toBe(false);
});

test("座標で置かれる配置は絶対配置である", () => {
  expect(Placement.isAbsolute(Placement.create("absolute", 40, 24))).toBe(true);
});

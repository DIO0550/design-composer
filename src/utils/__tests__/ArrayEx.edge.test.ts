import { expect, test } from "vitest";
import { ArrayEx } from "../ArrayEx";

test("範囲外の index を指定して insertAt を呼ぶとエラーになる", () => {
  expect(() => ArrayEx.insertAt(["a", "b"], 3, "c")).toThrow();
});

test("負の index を指定して insertAt を呼ぶとエラーになる", () => {
  expect(() => ArrayEx.insertAt(["a", "b"], -1, "c")).toThrow();
});

test("範囲外の fromIndex を指定して moveWithin を呼ぶとエラーになる", () => {
  expect(() => ArrayEx.moveWithin(["a", "b"], 5, 0)).toThrow();
});

test("範囲外の toIndex を指定して moveWithin を呼ぶとエラーになる", () => {
  expect(() => ArrayEx.moveWithin(["a", "b"], 0, 5)).toThrow();
});

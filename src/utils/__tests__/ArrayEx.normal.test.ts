import { expect, test } from "vitest";
import { ArrayEx } from "../ArrayEx";

test("配列の範囲内の index は isIndexInRange で true になる", () => {
  expect(ArrayEx.isIndexInRange(["a", "b", "c"], 1)).toBe(true);
});

test("配列の末尾要素の index は isIndexInRange で true になる", () => {
  expect(ArrayEx.isIndexInRange(["a", "b", "c"], 2)).toBe(true);
});

test("配列の要素数と同じ index は isIndexInRange で false になる", () => {
  expect(ArrayEx.isIndexInRange(["a", "b", "c"], 3)).toBe(false);
});

test("負の index は isIndexInRange で false になる", () => {
  expect(ArrayEx.isIndexInRange(["a", "b", "c"], -1)).toBe(false);
});

test("空配列に対しては isIndexInRange が常に false になる", () => {
  expect(ArrayEx.isIndexInRange([], 0)).toBe(false);
});

test("配列の範囲内の index は isInsertionIndexInRange で true になる", () => {
  expect(ArrayEx.isInsertionIndexInRange(["a", "b", "c"], 1)).toBe(true);
});

test("配列の要素数と同じ index は isInsertionIndexInRange で true になる", () => {
  expect(ArrayEx.isInsertionIndexInRange(["a", "b", "c"], 3)).toBe(true);
});

test("配列の要素数より大きい index は isInsertionIndexInRange で false になる", () => {
  expect(ArrayEx.isInsertionIndexInRange(["a", "b", "c"], 4)).toBe(false);
});

test("負の index は isInsertionIndexInRange で false になる", () => {
  expect(ArrayEx.isInsertionIndexInRange(["a", "b", "c"], -1)).toBe(false);
});

test("空配列の先頭への挿入位置は isInsertionIndexInRange で true になる", () => {
  expect(ArrayEx.isInsertionIndexInRange([], 0)).toBe(true);
});

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

test("小数の index は isIndexInRange で false になる", () => {
  expect(ArrayEx.isIndexInRange(["a", "b", "c"], 1.5)).toBe(false);
});

test("小数の index は isInsertionIndexInRange で false になる", () => {
  expect(ArrayEx.isInsertionIndexInRange(["a", "b", "c"], 1.5)).toBe(false);
});

test("insertAt で指定位置に要素を挿入できる", () => {
  expect(ArrayEx.insertAt(["a", "c"], 1, "b")).toEqual(["a", "b", "c"]);
});

test("insertAt で配列末尾に要素を追加できる", () => {
  expect(ArrayEx.insertAt(["a", "b"], 2, "c")).toEqual(["a", "b", "c"]);
});

test("insertAt は元の配列を変更しない", () => {
  const array = ["a", "c"];
  ArrayEx.insertAt(array, 1, "b");
  expect(array).toEqual(["a", "c"]);
});

test("moveWithin で要素を後方へ移動できる", () => {
  expect(ArrayEx.moveWithin(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
});

test("moveWithin で要素を前方へ移動できる", () => {
  expect(ArrayEx.moveWithin(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
});

test("moveWithin は元の配列を変更しない", () => {
  const array = ["a", "b", "c"];
  ArrayEx.moveWithin(array, 0, 2);
  expect(array).toEqual(["a", "b", "c"]);
});

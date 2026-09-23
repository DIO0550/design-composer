import { expect, test } from "vitest";
import { ArrayEx } from "../ArrayEx";
import { Option } from "../Option";

test("範囲外の index を指定して insertAt を呼ぶと範囲外として Err が返る", () => {
  expect(ArrayEx.insertAt(["a", "b"], 3, "c")).toEqual({
    ok: false,
    error: { index: 3, length: 2 },
  });
});

test("負の index を指定して insertAt を呼ぶと範囲外として Err が返る", () => {
  expect(ArrayEx.insertAt(["a", "b"], -1, "c")).toEqual({
    ok: false,
    error: { index: -1, length: 2 },
  });
});

test("範囲外の fromIndex を指定して moveWithin を呼ぶと範囲外として Err が返る", () => {
  expect(ArrayEx.moveWithin(["a", "b"], 5, 0)).toEqual({
    ok: false,
    error: { index: 5, length: 2 },
  });
});

test("範囲外の toIndex を指定して moveWithin を呼ぶと範囲外として Err が返る", () => {
  expect(ArrayEx.moveWithin(["a", "b"], 0, 5)).toEqual({
    ok: false,
    error: { index: 5, length: 2 },
  });
});

test("範囲外の index を指定して replaceAt を呼ぶと範囲外として Err が返る", () => {
  expect(ArrayEx.replaceAt(["a", "b"], 2, "c")).toEqual({
    ok: false,
    error: { index: 2, length: 2 },
  });
});

test("負の index を指定して replaceAt を呼ぶと範囲外として Err が返る", () => {
  expect(ArrayEx.replaceAt(["a", "b"], -1, "c")).toEqual({
    ok: false,
    error: { index: -1, length: 2 },
  });
});

test("空の並びには先頭が無い", () => {
  expect(ArrayEx.first([])).toEqual(Option.none);
});

test("空の並びには末尾が無い", () => {
  expect(ArrayEx.last([])).toEqual(Option.none);
});

test("空の並びから先頭を除いても空のまま", () => {
  expect(ArrayEx.dropFirst([])).toEqual([]);
});

test("空の並びから末尾を除いても空のまま", () => {
  expect(ArrayEx.dropLast([])).toEqual([]);
});

test("要素が 1 つの並びから末尾を除くと空になる", () => {
  expect(ArrayEx.dropLast(["a"])).toEqual([]);
});

test("findEqual は空の並びでは none を返す", () => {
  expect(ArrayEx.findEqual([], "a")).toEqual(Option.none);
});

test("distinct は NaN どうしを等しいとみなし、NaN を 1 つ残す", () => {
  expect(ArrayEx.distinct([Number.NaN, 1, Number.NaN])).toEqual([
    Number.NaN,
    1,
  ]);
});

test("prependIfAbsent は NaN が既にあれば NaN を足さない", () => {
  expect(ArrayEx.prependIfAbsent([1, Number.NaN], Number.NaN)).toEqual([
    1,
    Number.NaN,
  ]);
});

test("findEqual は NaN を探すと並びの中の NaN を見つける", () => {
  expect(ArrayEx.findEqual([1, Number.NaN], Number.NaN)).toEqual(
    Option.some(Number.NaN),
  );
});

test("distinct は 0 と -0 を等しいとみなし、先に現れた 0 だけを残す", () => {
  expect(ArrayEx.distinct([0, -0])).toEqual([0]);
});

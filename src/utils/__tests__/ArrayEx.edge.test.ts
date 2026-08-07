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

test("空配列には先頭が無いので first は none になる", () => {
  expect(ArrayEx.first([])).toEqual(Option.none);
});

test("空配列には末尾が無いので last は none になる", () => {
  expect(ArrayEx.last([])).toEqual(Option.none);
});

test("空配列の dropFirst は空のままになる", () => {
  expect(ArrayEx.dropFirst([])).toEqual([]);
});

test("空配列の dropLast は空のままになる", () => {
  expect(ArrayEx.dropLast([])).toEqual([]);
});

test("要素が1つだけの配列の dropLast は空になる", () => {
  expect(ArrayEx.dropLast(["a"])).toEqual([]);
});

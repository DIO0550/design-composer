import { expect, test } from "vitest";
import { ArrayEx } from "../ArrayEx";

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

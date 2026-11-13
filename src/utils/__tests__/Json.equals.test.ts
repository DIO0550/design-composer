import { expect, test } from "vitest";
import { Json } from "@/utils/Json";

test("キーの並びが違っても、同じキーに同じ値を持つオブジェクトは等しい", () => {
  expect(Json.equals({ a: 1, b: "x" }, { b: "x", a: 1 })).toBe(true);
});

test("入れ子の値まで同じなら等しい", () => {
  expect(
    Json.equals({ list: [1, { c: true }] }, { list: [1, { c: true }] }),
  ).toBe(true);
});

test("配列の並びが違えば等しくない", () => {
  expect(Json.equals([1, 2], [2, 1])).toBe(false);
});

test("後ろの値にしか無いキーがあれば等しくない", () => {
  expect(Json.equals({ a: 1 }, { a: 1, b: 2 })).toBe(false);
});

test("前の値にしか無いキーがあれば等しくない", () => {
  expect(Json.equals({ a: 1, b: 2 }, { a: 1 })).toBe(false);
});

test("入れ子の値が違えば等しくない", () => {
  expect(Json.equals({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
});

test("空の配列と空のオブジェクトは等しくない", () => {
  expect(Json.equals([], {})).toBe(false);
});

test("文字列の数字と数値は等しくない", () => {
  expect(Json.equals("1", 1)).toBe(false);
});

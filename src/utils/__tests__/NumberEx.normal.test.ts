import { expect, test } from "vitest";
import { NumberEx } from "../NumberEx";

test("0 は自然数として true になる", () => {
  expect(NumberEx.isNatural(0)).toBe(true);
});

test("正の整数は自然数として true になる", () => {
  expect(NumberEx.isNatural(5)).toBe(true);
});

test("負の整数は自然数として false になる", () => {
  expect(NumberEx.isNatural(-1)).toBe(false);
});

test("小数は自然数として false になる", () => {
  expect(NumberEx.isNatural(1.5)).toBe(false);
});

test("NaN は自然数として false になる", () => {
  expect(NumberEx.isNatural(Number.NaN)).toBe(false);
});

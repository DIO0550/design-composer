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

test("正の小数は有限の正の数として true になる", () => {
  expect(NumberEx.isFinitePositive(1.5)).toBe(true);
});

test("0 は有限の正の数として false になる", () => {
  expect(NumberEx.isFinitePositive(0)).toBe(false);
});

test("負の数は有限の正の数として false になる", () => {
  expect(NumberEx.isFinitePositive(-1)).toBe(false);
});

test("Infinity は有限の正の数として false になる", () => {
  expect(NumberEx.isFinitePositive(Number.POSITIVE_INFINITY)).toBe(false);
});

test("NaN は有限の正の数として false になる", () => {
  expect(NumberEx.isFinitePositive(Number.NaN)).toBe(false);
});

test("0 は有限の非負の数として true になる", () => {
  expect(NumberEx.isFiniteNonNegative(0)).toBe(true);
});

test("負の数は有限の非負の数として false になる", () => {
  expect(NumberEx.isFiniteNonNegative(-0.5)).toBe(false);
});

test("Infinity は有限の非負の数として false になる", () => {
  expect(NumberEx.isFiniteNonNegative(Number.POSITIVE_INFINITY)).toBe(false);
});

test("NaN は有限の非負の数として false になる", () => {
  expect(NumberEx.isFiniteNonNegative(Number.NaN)).toBe(false);
});

test("下端と上端はどちらも範囲に入っているとみなされる", () => {
  const range = { min: 100, max: 900 };

  expect(NumberEx.isWithin(100, range)).toBe(true);
  expect(NumberEx.isWithin(900, range)).toBe(true);
});

test("下端の手前と上端の先は範囲の外になる", () => {
  const range = { min: 100, max: 900 };

  expect(NumberEx.isWithin(99, range)).toBe(false);
  expect(NumberEx.isWithin(901, range)).toBe(false);
});

test("NaN と Infinity は有限の範囲の外になる", () => {
  const range = { min: 100, max: 900 };

  expect(NumberEx.isWithin(Number.NaN, range)).toBe(false);
  expect(NumberEx.isWithin(Number.POSITIVE_INFINITY, range)).toBe(false);
});

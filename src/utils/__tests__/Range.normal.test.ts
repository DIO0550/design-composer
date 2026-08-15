import { expect, test } from "vitest";
import { Range } from "../Range";

test("下端と上端はどちらも範囲に入っているとみなされる", () => {
  const range = { min: 100, max: 900 };

  expect(Range.contains(range, 100)).toBe(true);
  expect(Range.contains(range, 900)).toBe(true);
});

test("下端と上端の間は範囲に入っている", () => {
  expect(Range.contains({ min: 100, max: 900 }, 450)).toBe(true);
});

test("下端の手前と上端の先は範囲の外になる", () => {
  const range = { min: 100, max: 900 };

  expect(Range.contains(range, 99)).toBe(false);
  expect(Range.contains(range, 901)).toBe(false);
});

test("NaN と Infinity は有限の範囲の外になる", () => {
  const range = { min: 100, max: 900 };

  expect(Range.contains(range, Number.NaN)).toBe(false);
  expect(Range.contains(range, Number.POSITIVE_INFINITY)).toBe(false);
  expect(Range.contains(range, Number.NEGATIVE_INFINITY)).toBe(false);
});

test("下端と上端が同じ範囲には、その1つの値だけが入る", () => {
  const range = { min: 400, max: 400 };

  expect(Range.contains(range, 400)).toBe(true);
  expect(Range.contains(range, 401)).toBe(false);
});

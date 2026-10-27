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

test("一部が重なる 2 つの範囲は、重なっている部分の長さを返す", () => {
  expect(
    Range.intersectionLength({ min: 0, max: 20 }, { min: 15, max: 40 }),
  ).toBe(5);
});

test("一方がもう一方を含むときは、内側の範囲の長さを返す", () => {
  expect(
    Range.intersectionLength({ min: 0, max: 100 }, { min: 30, max: 40 }),
  ).toBe(10);
});

test("端が接するだけの 2 つの範囲は、重なりの長さが 0 になる", () => {
  expect(
    Range.intersectionLength({ min: 0, max: 20 }, { min: 20, max: 40 }),
  ).toBe(0);
});

test("離れている 2 つの範囲は、重なりの長さが 0 になる", () => {
  // 差をそのまま返すと -10 になる
  expect(
    Range.intersectionLength({ min: 0, max: 20 }, { min: 30, max: 40 }),
  ).toBe(0);
});

test("範囲の長さは、上端から下端を引いたもの", () => {
  expect(Range.length({ min: 15, max: 40 })).toBe(25);
});

test("範囲の中央は、下端と上端の真ん中", () => {
  expect(Range.center({ min: 15, max: 40 })).toBe(27.5);
});

test("相手の上端より後ろから始まる範囲は、相手に続いている", () => {
  expect(Range.follows({ min: 60, max: 90 }, { min: 10, max: 50 })).toBe(true);
});

test("相手の上端と下端が接する範囲も、相手に続いている", () => {
  expect(Range.follows({ min: 50, max: 90 }, { min: 10, max: 50 })).toBe(true);
});

test("相手と重なっている範囲は、相手に続いていない", () => {
  expect(Range.follows({ min: 40, max: 90 }, { min: 10, max: 50 })).toBe(false);
});

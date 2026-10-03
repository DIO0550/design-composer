import { expect, test } from "vitest";
import { Option } from "../Option";
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

test("離れている 2 つの範囲の間は、前の範囲の上端から後ろの範囲の下端まで", () => {
  expect(Range.gapBetween({ min: 0, max: 20 }, { min: 30, max: 40 })).toEqual(
    Option.some({ min: 20, max: 30 }),
  );
});

test("後ろの範囲を先に渡しても、2 つの範囲の間は同じになる", () => {
  // 引数の順で上端・下端を取る実装だと { min: 40, max: 0 } のような向きの逆な範囲になる
  expect(Range.gapBetween({ min: 30, max: 40 }, { min: 0, max: 20 })).toEqual(
    Option.some({ min: 20, max: 30 }),
  );
});

test("範囲の長さは、上端から下端を引いたもの", () => {
  expect(Range.length({ min: 15, max: 40 })).toBe(25);
});

test("範囲の中央は、下端と上端の真ん中", () => {
  expect(Range.center({ min: 15, max: 40 })).toBe(27.5);
});

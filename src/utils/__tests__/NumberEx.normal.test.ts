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

test("範囲の内側にある値はそのまま返る", () => {
  expect(NumberEx.clamp(24, { min: 0, max: 216 })).toBe(24);
});

test("上限を超えた値は上限で止まる", () => {
  expect(NumberEx.clamp(300, { min: 0, max: 216 })).toBe(216);
});

test("下限を下回った値は下限で止まる", () => {
  expect(NumberEx.clamp(-44, { min: 0, max: 216 })).toBe(0);
});

test("下限が上限を上回る範囲では上限が勝つ", () => {
  // 収める先が潰れているときにどちらへ寄るかは、上限を渡す側が壊れた場合の
  // 答えを決める（`RepositionLimit` はこの向きに依存している）
  expect(NumberEx.clamp(24, { min: 100, max: 10 })).toBe(10);
});

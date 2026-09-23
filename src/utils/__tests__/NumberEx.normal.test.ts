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
  // 範囲が潰れているときにどちらへ寄るかは `clamp` 自身の仕様（@returns に書いてある）。
  // 渡す側が壊れたときの答えがここで決まるので、消費側の有無に依らず固定する
  expect(NumberEx.clamp(24, { min: 100, max: 10 })).toBe(10);
});

test("指定した桁で丸めると二進小数の誤差が落ちる", () => {
  expect(NumberEx.round(0.007 * 100, 4)).toBe(0.7);
});

test("指定した桁より下がある値は四捨五入される", () => {
  expect(NumberEx.round(1.23456, 2)).toBe(1.23);
  expect(NumberEx.round(1.23556, 2)).toBe(1.24);
});

test("指定した桁より上しか持たない値は変わらない", () => {
  expect(NumberEx.round(12.5, 4)).toBe(12.5);
});

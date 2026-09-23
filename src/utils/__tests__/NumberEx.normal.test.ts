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

test("指定した桁で丸めると二進小数の端数が落ちる", () => {
  expect(NumberEx.round(0.7000000000000001, 4)).toBe(0.7);
});

test("指定した桁より下は四捨五入される", () => {
  expect(NumberEx.round(12.3456789, 4)).toBe(12.3457);
});

test("小数第1位まで丸める", () => {
  expect(NumberEx.round(39.2156862745098, 1)).toBe(39.2);
});

test("負の半端値は0に近い側へ丸まる", () => {
  // 半端値が +∞ の側へ寄るのは `round` 自身の仕様（@returns に書いてある）。
  // 負の比率を綴る経路がここを通るので、寄る向きを固定する
  expect(NumberEx.round(-0.15, 1)).toBe(-0.1);
});

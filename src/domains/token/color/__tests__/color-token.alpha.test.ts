import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { ColorToken } from "../index";

test("alpha の桁を持たない色の不透明度は 100% になる", () => {
  expect(ColorToken.alphaPercentOf("#3b82f6")).toBe(100);
});

test("alpha を持つ色の不透明度は % で読める", () => {
  expect(ColorToken.alphaPercentOf("#3b82f680")).toBe(50.2);
});

test("不透明度は小数第1位まで読める", () => {
  expect(ColorToken.alphaPercentOf("#0000001a")).toBe(10.2);
});

test("不透明度を 50% にすると alpha は 80 になる", () => {
  expect(ColorToken.withAlphaPercent("#3b82f6", 50)).toEqual(
    Option.some("#3b82f680"),
  );
});

test("不透明度を 100% にすると alpha の桁が落ちる", () => {
  expect(ColorToken.withAlphaPercent("#3b82f680", 100)).toEqual(
    Option.some("#3b82f6"),
  );
});

test("不透明度は 0% まで下げられる", () => {
  expect(ColorToken.withAlphaPercent("#3b82f6", 0)).toEqual(
    Option.some("#3b82f600"),
  );
});

test("不透明度を差し替えても RGB は変わらない", () => {
  expect(ColorToken.withAlphaPercent("#0000001a", 50)).toEqual(
    Option.some("#00000080"),
  );
});

test.each([
  -1,
  101,
  Number.NaN,
])("0–100 の外の不透明度 %s では色を変えない", (percent) => {
  expect(ColorToken.withAlphaPercent("#3b82f6", percent)).toEqual(Option.none);
});

/*
 * 往復が閉じることは「値が変わらない」という 1 つの仕様なので 1 テストで見る。
 * 初期テーマが持つ alpha（1a / 26 / 33）は整数 % でもたまたま往復するため、
 * その 3 つだけを並べても丸めの粒度を壊した実装が通ってしまう
 * （rules/testing.md「既定値と違う答えになる入力を選ぶ」）。
 */
test("保存されている alpha は % を経由しても同じ値に戻る", () => {
  const roundTripped = Array.from({ length: 256 }, (_, byte) => {
    const color = `#3b82f6${byte.toString(16).padStart(2, "0")}`;
    return Option.unwrap(
      ColorToken.withAlphaPercent(color, ColorToken.alphaPercentOf(color)),
    );
  });
  const normalized = Array.from({ length: 256 }, (_, byte) =>
    ColorToken.normalize(`#3b82f6${byte.toString(16).padStart(2, "0")}`),
  );

  expect(roundTripped).toEqual(normalized);
});

import { expect, test } from "vitest";
import { Option } from "../Option";

test.each([
  [0],
  [false],
  [""],
])("falsy な値 %j でも fromNullable は存在する値として扱う", (value) => {
  expect(Option.fromNullable(value)).toEqual({ some: true, value });
});

test("unwrapOr は falsy な値 0 をデフォルト値で上書きしない", () => {
  expect(Option.unwrapOr(Option.some(0), 1)).toBe(0);
});

test("map は変換結果が null の場合 none を返す", () => {
  expect(Option.map(Option.some(2), () => null)).toBe(Option.none);
});

test("map は変換結果が undefined の場合 none を返す", () => {
  expect(Option.map(Option.some(1), () => undefined)).toBe(Option.none);
});

test("map は none に対して変換関数を実行しない", () => {
  const result = Option.map(Option.none, () => {
    throw new Error("実行されないはず");
  });
  expect(result).toBe(Option.none);
});

test("flatMap は none に対して連結処理を実行しない", () => {
  const result = Option.flatMap(Option.none, () => {
    throw new Error("実行されないはず");
  });
  expect(result).toBe(Option.none);
});

test("map の変換関数が例外を投げた場合はそのまま伝播する", () => {
  const error = new Error("test error");
  expect(() =>
    Option.map(Option.some(1), () => {
      throw error;
    }),
  ).toThrow(error);
});

test("some で生成した値は凍結されていて変更できない", () => {
  expect(Object.isFrozen(Option.some(42))).toBe(true);
});

test("none は凍結されていて変更できない", () => {
  expect(Object.isFrozen(Option.none)).toBe(true);
});

test("none は常に同一のインスタンスである", () => {
  expect(Option.fromNullable(null)).toBe(Option.fromNullable(undefined));
});

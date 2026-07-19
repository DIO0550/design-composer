import { expect, test } from "vitest";
import { Option } from "../Option";

test("some で生成した値は存在する値として保持される", () => {
  expect(Option.some(42)).toEqual({ some: true, value: 42 });
});

test("none は値が存在しないことを表す", () => {
  expect(Option.none).toEqual({ some: false });
});

test("fromNullable は有効な値に対して存在する値を返す", () => {
  expect(Option.fromNullable(42)).toEqual({ some: true, value: 42 });
});

test("fromNullable は null に対して none を返す", () => {
  expect(Option.fromNullable(null)).toBe(Option.none);
});

test("fromNullable は undefined に対して none を返す", () => {
  expect(Option.fromNullable(undefined)).toBe(Option.none);
});

test("some フラグで絞り込むと値にアクセスできる", () => {
  const option: Option<number> = Option.some(42);
  expect(option.some && option.value).toBe(42);
});

test("map は存在する値を変換した新しい値を返す", () => {
  expect(Option.map(Option.some(2), (v) => v * 3)).toEqual({
    some: true,
    value: 6,
  });
});

test("map は none をそのまま返す", () => {
  expect(Option.map(Option.none, (v: number) => v * 3)).toBe(Option.none);
});

test("flatMap は存在する値に続く処理を連結できる", () => {
  expect(Option.flatMap(Option.some(2), (v) => Option.some(v * 3))).toEqual({
    some: true,
    value: 6,
  });
});

test("flatMap は連結した処理が none を返した場合 none になる", () => {
  expect(Option.flatMap(Option.some(2), () => Option.none)).toBe(Option.none);
});

test("flatMap は none で短絡してそのまま返す", () => {
  expect(Option.flatMap(Option.none, (v: number) => Option.some(v * 3))).toBe(
    Option.none,
  );
});

test("unwrapOr は存在する値を取り出す", () => {
  expect(Option.unwrapOr(Option.some(42), 0)).toBe(42);
});

test("unwrapOr は none に対してデフォルト値を返す", () => {
  expect(Option.unwrapOr(Option.none, 0)).toBe(0);
});

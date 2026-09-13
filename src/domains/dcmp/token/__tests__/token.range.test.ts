import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { TokenValue } from "../index";

test("余白は 0 を受け付ける", () => {
  expect(Option.isSome(TokenValue.createNumeric("spacing", 0))).toBe(true);
});

test("余白は負の数を受け付けない", () => {
  expect(Option.isSome(TokenValue.createNumeric("spacing", -1))).toBe(false);
});

test("角丸は負の数を受け付けない", () => {
  expect(Option.isSome(TokenValue.createNumeric("radius", -1))).toBe(false);
});

test("有限でない長さは受け付けない", () => {
  expect(
    Option.isSome(
      TokenValue.createNumeric("spacing", Number.POSITIVE_INFINITY),
    ),
  ).toBe(false);
  expect(Option.isSome(TokenValue.createNumeric("radius", Number.NaN))).toBe(
    false,
  );
});

test("受け付けた長さはその種別の値になる", () => {
  expect(Option.unwrap(TokenValue.createNumeric("radius", 9999))).toEqual({
    kind: "radius",
    value: 9999,
  });
});

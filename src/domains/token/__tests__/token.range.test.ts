import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { type NumericTokenKind, TokenValue } from "../index";

/**
 * 長さの種別の値域（docs/04-tokens.md「値の形式」の spacing / radius）。
 * 受け付けたかどうかだけを見たいので、値は `some` かで比べる。
 */
function accepts(kind: NumericTokenKind, value: number): boolean {
  return TokenValue.createNumeric(kind, value).some;
}

test("余白は 0 を受け付ける", () => {
  expect(accepts("spacing", 0)).toBe(true);
});

test("余白は負の数を受け付けない", () => {
  expect(accepts("spacing", -1)).toBe(false);
});

test("角丸は負の数を受け付けない", () => {
  expect(accepts("radius", -1)).toBe(false);
});

test("有限でない長さは受け付けない", () => {
  expect(accepts("spacing", Number.POSITIVE_INFINITY)).toBe(false);
  expect(accepts("radius", Number.NaN)).toBe(false);
});

test("受け付けた長さはその種別の値になる", () => {
  expect(Option.unwrap(TokenValue.createNumeric("radius", 9999))).toEqual({
    kind: "radius",
    value: 9999,
  });
});

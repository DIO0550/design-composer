import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { TypographyFieldEdit, type TypographyNumberField } from "../index";

/**
 * 書体の値域（docs/04-tokens.md「typography」）。
 * 受け付けたかどうかだけを見たいので、値は `some` かで比べる。
 */
function accepts(field: TypographyNumberField, value: number): boolean {
  return TypographyFieldEdit.create(field, value).some;
}

test("書体の太さは 100 と 900 を受け付ける", () => {
  expect(accepts("fontWeight", 100)).toBe(true);
  expect(accepts("fontWeight", 900)).toBe(true);
});

test("書体の太さは 100 未満と 900 超えを受け付けない", () => {
  expect(accepts("fontWeight", 99)).toBe(false);
  expect(accepts("fontWeight", 901)).toBe(false);
});

test("書体の太さは 100 刻みでない値も受け付ける", () => {
  expect(accepts("fontWeight", 450)).toBe(true);
});

test("書体のサイズは正の数を受け付ける", () => {
  expect(accepts("fontSize", 0.5)).toBe(true);
});

test("書体のサイズは 0 と負の数を受け付けない", () => {
  expect(accepts("fontSize", 0)).toBe(false);
  expect(accepts("fontSize", -1)).toBe(false);
});

test("行間は正の数を受け付ける", () => {
  expect(accepts("lineHeight", 0.5)).toBe(true);
});

test("行間は 0 と負の数を受け付けない", () => {
  expect(accepts("lineHeight", 0)).toBe(false);
  expect(accepts("lineHeight", -1.6)).toBe(false);
});

test("有限でない値はどのフィールドでも受け付けない", () => {
  expect(accepts("fontSize", Number.POSITIVE_INFINITY)).toBe(false);
  expect(accepts("lineHeight", Number.NaN)).toBe(false);
  expect(accepts("fontWeight", Number.POSITIVE_INFINITY)).toBe(false);
});

test("受け付けた値はそのフィールドの書き換えになる", () => {
  expect(Option.unwrap(TypographyFieldEdit.create("fontWeight", 700))).toEqual({
    field: "fontWeight",
    value: 700,
  });
});

import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { TypographyFieldEdit } from "../index";

test("書体の太さは 100 と 900 を受け付ける", () => {
  expect(TypographyFieldEdit.createNumeric("fontWeight", 100).some).toBe(true);
  expect(TypographyFieldEdit.createNumeric("fontWeight", 900).some).toBe(true);
});

test("書体の太さは 100 未満と 900 超えを受け付けない", () => {
  expect(TypographyFieldEdit.createNumeric("fontWeight", 99).some).toBe(false);
  expect(TypographyFieldEdit.createNumeric("fontWeight", 901).some).toBe(false);
});

test("書体の太さは 100 刻みでない値も受け付ける", () => {
  expect(TypographyFieldEdit.createNumeric("fontWeight", 450).some).toBe(true);
});

test("書体のサイズは正の数を受け付ける", () => {
  expect(TypographyFieldEdit.createNumeric("fontSize", 0.5).some).toBe(true);
});

test("書体のサイズは 0 と負の数を受け付けない", () => {
  expect(TypographyFieldEdit.createNumeric("fontSize", 0).some).toBe(false);
  expect(TypographyFieldEdit.createNumeric("fontSize", -1).some).toBe(false);
});

test("行間は正の数を受け付ける", () => {
  expect(TypographyFieldEdit.createNumeric("lineHeight", 0.5).some).toBe(true);
});

test("行間は 0 と負の数を受け付けない", () => {
  expect(TypographyFieldEdit.createNumeric("lineHeight", 0).some).toBe(false);
  expect(TypographyFieldEdit.createNumeric("lineHeight", -1.6).some).toBe(
    false,
  );
});

test("有限でない値はどのフィールドでも受け付けない", () => {
  expect(
    TypographyFieldEdit.createNumeric("fontSize", Number.POSITIVE_INFINITY)
      .some,
  ).toBe(false);
  expect(TypographyFieldEdit.createNumeric("lineHeight", Number.NaN).some).toBe(
    false,
  );
  expect(
    TypographyFieldEdit.createNumeric("fontWeight", Number.POSITIVE_INFINITY)
      .some,
  ).toBe(false);
});

test("受け付けた値はそのフィールドの書き換えになる", () => {
  expect(
    Option.unwrap(TypographyFieldEdit.createNumeric("fontWeight", 700)),
  ).toEqual({ field: "fontWeight", value: 700 });
});

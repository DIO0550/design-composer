import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { TypographyFieldEdit } from "../index";

test("書体の太さは 100 と 900 を受け付ける", () => {
  expect(
    Option.isSome(TypographyFieldEdit.createNumeric("fontWeight", 100)),
  ).toBe(true);
  expect(
    Option.isSome(TypographyFieldEdit.createNumeric("fontWeight", 900)),
  ).toBe(true);
});

test("書体の太さは 100 未満と 900 超えを受け付けない", () => {
  expect(
    Option.isSome(TypographyFieldEdit.createNumeric("fontWeight", 99)),
  ).toBe(false);
  expect(
    Option.isSome(TypographyFieldEdit.createNumeric("fontWeight", 901)),
  ).toBe(false);
});

test("書体の太さは 100 刻みでない値も受け付ける", () => {
  expect(
    Option.isSome(TypographyFieldEdit.createNumeric("fontWeight", 450)),
  ).toBe(true);
});

test("書体のサイズは正の数を受け付ける", () => {
  expect(
    Option.isSome(TypographyFieldEdit.createNumeric("fontSize", 0.5)),
  ).toBe(true);
});

test("書体のサイズは 0 と負の数を受け付けない", () => {
  expect(Option.isSome(TypographyFieldEdit.createNumeric("fontSize", 0))).toBe(
    false,
  );
  expect(Option.isSome(TypographyFieldEdit.createNumeric("fontSize", -1))).toBe(
    false,
  );
});

test("行間は正の数を受け付ける", () => {
  expect(
    Option.isSome(TypographyFieldEdit.createNumeric("lineHeight", 0.5)),
  ).toBe(true);
});

test("行間は 0 と負の数を受け付けない", () => {
  expect(
    Option.isSome(TypographyFieldEdit.createNumeric("lineHeight", 0)),
  ).toBe(false);
  expect(
    Option.isSome(TypographyFieldEdit.createNumeric("lineHeight", -1.6)),
  ).toBe(false);
});

test("有限でない値はどのフィールドでも受け付けない", () => {
  expect(
    Option.isSome(
      TypographyFieldEdit.createNumeric("fontSize", Number.POSITIVE_INFINITY),
    ),
  ).toBe(false);
  expect(
    Option.isSome(TypographyFieldEdit.createNumeric("lineHeight", Number.NaN)),
  ).toBe(false);
  expect(
    Option.isSome(
      TypographyFieldEdit.createNumeric("fontWeight", Number.POSITIVE_INFINITY),
    ),
  ).toBe(false);
});

test("受け付けた値はそのフィールドの書き換えになる", () => {
  expect(
    Option.unwrap(TypographyFieldEdit.createNumeric("fontWeight", 700)),
  ).toEqual({ field: "fontWeight", value: 700 });
});

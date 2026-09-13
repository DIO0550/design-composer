import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { ShadowFieldEdit } from "../index";

test("ぼかしは 0 を受け付ける", () => {
  expect(Option.isSome(ShadowFieldEdit.createNumeric("blur", 0))).toBe(true);
});

test("ぼかしは負の数を受け付けない", () => {
  expect(Option.isSome(ShadowFieldEdit.createNumeric("blur", -1))).toBe(false);
});

test("ずれと広がりは負の数も受け付ける", () => {
  expect(Option.isSome(ShadowFieldEdit.createNumeric("x", -4))).toBe(true);
  expect(Option.isSome(ShadowFieldEdit.createNumeric("y", -4))).toBe(true);
  expect(Option.isSome(ShadowFieldEdit.createNumeric("spread", -2))).toBe(true);
});

test("有限でない値はどのフィールドでも受け付けない", () => {
  expect(
    Option.isSome(
      ShadowFieldEdit.createNumeric("blur", Number.POSITIVE_INFINITY),
    ),
  ).toBe(false);
  expect(
    Option.isSome(ShadowFieldEdit.createNumeric("x", Number.NEGATIVE_INFINITY)),
  ).toBe(false);
  expect(
    Option.isSome(ShadowFieldEdit.createNumeric("spread", Number.NaN)),
  ).toBe(false);
});

test("受け付けた値はそのフィールドの書き換えになる", () => {
  expect(Option.unwrap(ShadowFieldEdit.createNumeric("blur", 8))).toEqual({
    field: "blur",
    value: 8,
  });
});

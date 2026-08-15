import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { ShadowFieldEdit } from "../index";

test("ぼかしは 0 を受け付ける", () => {
  expect(ShadowFieldEdit.createNumeric("blur", 0).some).toBe(true);
});

test("ぼかしは負の数を受け付けない", () => {
  expect(ShadowFieldEdit.createNumeric("blur", -1).some).toBe(false);
});

test("ずれと広がりは負の数も受け付ける", () => {
  expect(ShadowFieldEdit.createNumeric("x", -4).some).toBe(true);
  expect(ShadowFieldEdit.createNumeric("y", -4).some).toBe(true);
  expect(ShadowFieldEdit.createNumeric("spread", -2).some).toBe(true);
});

test("有限でない値はどのフィールドでも受け付けない", () => {
  expect(
    ShadowFieldEdit.createNumeric("blur", Number.POSITIVE_INFINITY).some,
  ).toBe(false);
  expect(
    ShadowFieldEdit.createNumeric("x", Number.NEGATIVE_INFINITY).some,
  ).toBe(false);
  expect(ShadowFieldEdit.createNumeric("spread", Number.NaN).some).toBe(false);
});

test("受け付けた値はそのフィールドの書き換えになる", () => {
  expect(Option.unwrap(ShadowFieldEdit.createNumeric("blur", 8))).toEqual({
    field: "blur",
    value: 8,
  });
});

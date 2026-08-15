import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { ShadowFieldEdit, type ShadowNumberField } from "../index";

/**
 * 影の値域（docs/04-tokens.md「shadows」）。
 * 受け付けたかどうかだけを見たいので、値は `some` かで比べる。
 */
function accepts(field: ShadowNumberField, value: number): boolean {
  return ShadowFieldEdit.create(field, value).some;
}

test("ぼかしは 0 を受け付ける", () => {
  expect(accepts("blur", 0)).toBe(true);
});

test("ぼかしは負の数を受け付けない", () => {
  expect(accepts("blur", -1)).toBe(false);
});

test("ずれと広がりは負の数も受け付ける", () => {
  expect(accepts("x", -4)).toBe(true);
  expect(accepts("y", -4)).toBe(true);
  expect(accepts("spread", -2)).toBe(true);
});

test("有限でない値はどのフィールドでも受け付けない", () => {
  expect(accepts("blur", Number.POSITIVE_INFINITY)).toBe(false);
  expect(accepts("x", Number.NEGATIVE_INFINITY)).toBe(false);
  expect(accepts("spread", Number.NaN)).toBe(false);
});

test("受け付けた値はそのフィールドの書き換えになる", () => {
  expect(Option.unwrap(ShadowFieldEdit.create("blur", 8))).toEqual({
    field: "blur",
    value: 8,
  });
});

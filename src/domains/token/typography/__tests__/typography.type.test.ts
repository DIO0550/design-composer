import { expectTypeOf, test } from "vitest";
import type {
  TypographyCssProperty,
  TypographyField,
  TypographyToken,
} from "../index";

test("TypographyField は TypographyToken が持つフィールドと完全に一致する", () => {
  expectTypeOf<TypographyField>().toEqualTypeOf<
    keyof Required<TypographyToken>
  >();
});

test("全フィールドが CSS プロパティ名へ対応付けられる", () => {
  expectTypeOf<TypographyCssProperty>().toEqualTypeOf<
    "font-size" | "line-height" | "font-weight" | "font-family"
  >();
});

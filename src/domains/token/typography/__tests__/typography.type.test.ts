import { expectTypeOf, test } from "vitest";
import type {
  FontSize,
  FontWeight,
  LineHeight,
  TypographyCssProperty,
  TypographyField,
  TypographyFieldEdit,
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

test("値域を通っていない数値は書体の値として扱えない", () => {
  expectTypeOf<number>().not.toExtend<FontSize>();
  expectTypeOf<number>().not.toExtend<LineHeight>();
  expectTypeOf<number>().not.toExtend<FontWeight>();
});

test("書体の値どうしも取り違えられない", () => {
  expectTypeOf<FontSize>().not.toExtend<FontWeight>();
  expectTypeOf<FontWeight>().not.toExtend<LineHeight>();
});

test("書体のサイズを太さの書き換えとして渡せない", () => {
  expectTypeOf<{
    field: "fontWeight";
    value: FontSize;
  }>().not.toExtend<TypographyFieldEdit>();
});

import { expectTypeOf, test } from "vitest";
import type { Blur, ShadowField, ShadowFieldEdit, ShadowToken } from "../index";

test("ShadowField は ShadowToken が持つフィールドと完全に一致する", () => {
  expectTypeOf<ShadowField>().toEqualTypeOf<keyof Required<ShadowToken>>();
});

test("値域を通っていない数値はぼかしとして扱えない", () => {
  expectTypeOf<number>().not.toExtend<Blur>();
});

test("素の数値をぼかしの書き換えとして渡せない", () => {
  expectTypeOf<{
    field: "blur";
    value: number;
  }>().not.toExtend<ShadowFieldEdit>();
});

test("ずれと広がりは素の数値のままで書き換えになる", () => {
  expectTypeOf<{ field: "x"; value: number }>().toExtend<ShadowFieldEdit>();
  expectTypeOf<{
    field: "spread";
    value: number;
  }>().toExtend<ShadowFieldEdit>();
});

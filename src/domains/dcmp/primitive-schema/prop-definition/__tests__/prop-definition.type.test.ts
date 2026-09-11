import { expectTypeOf, test } from "vitest";
import type { LiteralPropDefinition } from "../index";

test("数値の生リテラル prop には値域を宣言できる", () => {
  const definition = {
    domain: "literal",
    literalType: "number",
    range: { min: 0, max: 1 },
    group: "appearance",
  } as const satisfies LiteralPropDefinition;

  expectTypeOf(definition.range).toEqualTypeOf<{
    readonly min: 0;
    readonly max: 1;
  }>();
});

test("文字列の生リテラル prop には値域を宣言できない", () => {
  const definition = {
    domain: "literal",
    literalType: "string",
    // @ts-expect-error 値域は数値の prop だけが持つ
    range: { min: 0, max: 1 },
    group: "content",
  } as const satisfies LiteralPropDefinition;

  expectTypeOf(definition.literalType).toEqualTypeOf<"string">();
});

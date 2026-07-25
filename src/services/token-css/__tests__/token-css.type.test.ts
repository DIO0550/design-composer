import { expectTypeOf, test } from "vitest";
import type { TokenKind, TypographyField } from "@/domains/token";
import type {
  SingleVariableTokenKind,
  TokenCss,
  TypographyCssProperty,
} from "../index";

test("単一のカスタムプロパティで表せる種別は typography 以外の全種別になる", () => {
  expectTypeOf<SingleVariableTokenKind>().toEqualTypeOf<
    Exclude<TokenKind, "typography">
  >();
});

test("複数の宣言へ展開される typography は単一の変数名を要求できない", () => {
  type VariableNameKind = Parameters<typeof TokenCss.variableName>[0];

  expectTypeOf<"typography">().not.toExtend<VariableNameKind>();
  expectTypeOf<"colors">().toExtend<VariableNameKind>();
});

test("typography のフィールドはすべて CSS プロパティ名へ対応付けられる", () => {
  expectTypeOf<TypographyCssProperty>().toEqualTypeOf<
    "font-size" | "line-height" | "font-weight" | "font-family"
  >();
  expectTypeOf<TypographyField>().toEqualTypeOf<
    "fontSize" | "lineHeight" | "fontWeight" | "fontFamily"
  >();
});

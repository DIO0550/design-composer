import { expectTypeOf, test } from "vitest";
import type { TokenKind, TypographyToken } from "@/domains/token";
import type {
  SingleValueTokenKind,
  TokenCss,
  TypographyCssField,
} from "../index";

test("CSS プロパティへ展開する typography のフィールドは TypographyToken の全フィールドを網羅する", () => {
  expectTypeOf<TypographyCssField>().toEqualTypeOf<
    keyof Required<TypographyToken>
  >();
});

test("単一の CSS 値を持つ種別は typography 以外の全種別になる", () => {
  expectTypeOf<SingleValueTokenKind>().toEqualTypeOf<
    Exclude<TokenKind, "typography">
  >();
});

test("複数の宣言へ展開される typography は単一の変数名を要求できない", () => {
  type VariableNameKind = Parameters<typeof TokenCss.variableName>[0];

  expectTypeOf<"typography">().not.toExtend<VariableNameKind>();
  expectTypeOf<"colors">().toExtend<VariableNameKind>();
});

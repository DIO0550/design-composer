import { expectTypeOf, test } from "vitest";
import type { TokenKind } from "@/domains/token";
import type {
  CssVariableName,
  CssVariableReference,
  SingleVariableTokenKind,
  TokenCss,
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

test("カスタムプロパティ名は -- で始まる文字列に限られる", () => {
  expectTypeOf<"--colors-primary">().toExtend<CssVariableName>();
  expectTypeOf<"colors-primary">().not.toExtend<CssVariableName>();
});

test("トークン参照は var() で包まれた文字列に限られる", () => {
  expectTypeOf<"var(--colors-primary)">().toExtend<CssVariableReference>();
  expectTypeOf<"--colors-primary">().not.toExtend<CssVariableReference>();
});

test("変数名と参照を返す関数はただの string を返さない", () => {
  expectTypeOf<
    ReturnType<typeof TokenCss.variableName>
  >().toEqualTypeOf<CssVariableName>();
  expectTypeOf<
    ReturnType<typeof TokenCss.ref>
  >().toEqualTypeOf<CssVariableReference>();
});

import { expectTypeOf, test } from "vitest";
import type { NumericTokenKind, TokenKind, TokenSet } from "../index";

test("TokenKind は TokenSet が持つ種別と完全に一致する", () => {
  expectTypeOf<TokenKind>().toEqualTypeOf<keyof TokenSet>();
});

test("NumericTokenKind は値がそのまま数値になる種別と完全に一致する", () => {
  expectTypeOf<NumericTokenKind>().toEqualTypeOf<"spacing" | "radius">();
});

import { expectTypeOf, test } from "vitest";
import type {
  TokenKind,
  TokenSet,
  TypographyField,
  TypographyToken,
} from "../index";

test("TokenKind は TokenSet が持つ種別と完全に一致する", () => {
  expectTypeOf<TokenKind>().toEqualTypeOf<keyof TokenSet>();
});

test("TypographyField は TypographyToken が持つフィールドと完全に一致する", () => {
  expectTypeOf<TypographyField>().toEqualTypeOf<
    keyof Required<TypographyToken>
  >();
});

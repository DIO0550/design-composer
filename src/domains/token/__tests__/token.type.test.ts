import { expectTypeOf, test } from "vitest";
import type { TokenKind, TokenSet } from "../index";

test("TokenKind は TokenSet が持つ種別と完全に一致する", () => {
  expectTypeOf<TokenKind>().toEqualTypeOf<keyof TokenSet>();
});

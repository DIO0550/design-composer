import { expectTypeOf, test } from "vitest";
import type { TokenKindList } from "../index";

test("トークン参照 prop は 1 つの種別か、塗り用の 2 種別を指せる", () => {
  expectTypeOf<readonly ["spacing"]>().toExtend<TokenKindList>();
  expectTypeOf<readonly ["colors", "gradients"]>().toExtend<TokenKindList>();
});

test("塗り用の 2 種別以外の組は指せる種別として宣言できない", () => {
  expectTypeOf<readonly ["spacing", "colors"]>().not.toExtend<TokenKindList>();
  expectTypeOf<
    readonly ["colors", "gradients", "spacing"]
  >().not.toExtend<TokenKindList>();
});

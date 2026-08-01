import { expect, expectTypeOf, test } from "vitest";
import { type TokenPropName, tokenKind } from "../index";

test("トークン参照 prop はスキーマで宣言されたトークン種別を答える", () => {
  expect(tokenKind("gap")).toBe("spacing");
  expect(tokenKind("radius")).toBe("radius");
  expect(tokenKind("shadow")).toBe("shadows");
});

test("primitive が違っても prop 名だけでトークン種別を引ける", () => {
  expect(tokenKind("background")).toBe("colors");
  expect(tokenKind("color")).toBe("colors");
});

test("トークン参照 prop の名前はスキーマの宣言だけで決まる", () => {
  expectTypeOf<"gap">().toExtend<TokenPropName>();
  expectTypeOf<"typography">().toExtend<TokenPropName>();
  // enum / literal で宣言された prop はトークンを引かない
  expectTypeOf<"direction">().not.toExtend<TokenPropName>();
  expectTypeOf<"width">().not.toExtend<TokenPropName>();
});

test("トークン種別は prop ごとにスキーマの宣言どおりの型で返る", () => {
  expectTypeOf(tokenKind("gap")).toEqualTypeOf<"spacing">();
  expectTypeOf(tokenKind("background")).toEqualTypeOf<"colors">();
});

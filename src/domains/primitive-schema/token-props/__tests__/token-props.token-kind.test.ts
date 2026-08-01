import { expect, expectTypeOf, test } from "vitest";
import { TokenPropKinds, type TokenPropName } from "../index";

test("トークン参照 prop はスキーマで宣言されたトークン種別を答える", () => {
  expect(TokenPropKinds.kindOf("gap")).toBe("spacing");
  expect(TokenPropKinds.kindOf("radius")).toBe("radius");
  expect(TokenPropKinds.kindOf("shadow")).toBe("shadows");
});

test("primitive が違っても prop 名だけでトークン種別を引ける", () => {
  expect(TokenPropKinds.kindOf("background")).toBe("colors");
  expect(TokenPropKinds.kindOf("color")).toBe("colors");
});

test("トークン参照 prop の名前はスキーマの宣言だけで決まる", () => {
  expectTypeOf<"gap">().toExtend<TokenPropName>();
  expectTypeOf<"typography">().toExtend<TokenPropName>();
  // enum / literal で宣言された prop はトークンを引かない
  expectTypeOf<"direction">().not.toExtend<TokenPropName>();
  expectTypeOf<"width">().not.toExtend<TokenPropName>();
});

test("トークン種別は prop ごとにスキーマの宣言どおりの型で返る", () => {
  expectTypeOf(TokenPropKinds.kindOf("gap")).toEqualTypeOf<"spacing">();
  expectTypeOf(TokenPropKinds.kindOf("background")).toEqualTypeOf<"colors">();
});

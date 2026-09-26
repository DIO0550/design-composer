import { expect, expectTypeOf, test } from "vitest";
import { TokenPropKinds, type TokenPropName } from "../index";

test("トークン参照 prop はスキーマで宣言されたトークン種別を答える", () => {
  expect(TokenPropKinds.kindsOf("gap")).toEqual(["spacing"]);
  expect(TokenPropKinds.kindsOf("radiusTopLeft")).toEqual(["radius"]);
  expect(TokenPropKinds.kindsOf("shadow")).toEqual(["shadows"]);
});

test("primitive が違っても prop 名だけでトークン種別を引ける", () => {
  expect(TokenPropKinds.kindsOf("color")).toEqual(["colors"]);
});

test("background は colors と gradients の両方を指せる", () => {
  expect(TokenPropKinds.kindsOf("background")).toEqual(["colors", "gradients"]);
});

test("トークン参照 prop の名前はスキーマの宣言だけで決まる", () => {
  expectTypeOf<"gap">().toExtend<TokenPropName>();
  expectTypeOf<"typography">().toExtend<TokenPropName>();
  // enum / literal で宣言された prop はトークンを引かない
  expectTypeOf<"layout">().not.toExtend<TokenPropName>();
  expectTypeOf<"width">().not.toExtend<TokenPropName>();
});

test("トークン種別は prop ごとにスキーマの宣言どおりの型で返る", () => {
  expectTypeOf(TokenPropKinds.kindsOf("gap")).toEqualTypeOf<
    readonly ["spacing"]
  >();
  expectTypeOf(TokenPropKinds.kindsOf("background")).toEqualTypeOf<
    readonly ["colors", "gradients"]
  >();
});

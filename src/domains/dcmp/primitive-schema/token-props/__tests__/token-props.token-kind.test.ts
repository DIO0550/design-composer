import { expect, expectTypeOf, test } from "vitest";
import type { PaintTokenKinds, TokenKind } from "@/domains/dcmp/token";
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

test("2 つの種別を指せる prop は塗りの組だけ", () => {
  /*
   * 塗りでない 2 種別の組を弾いているのは `TokenKindList`（`prop-definition`）。この観点は
   * その制約が `TokenPropKinds` の導出まで生き残っていることを見る。CSS 出力が単一種別と
   * 塗りを長さで分けられるのは、ここまで生きているため。
   */
  type MultiKind = Exclude<TokenPropKinds[TokenPropName], readonly [TokenKind]>;

  expectTypeOf<MultiKind>().toEqualTypeOf<PaintTokenKinds>();
});

test("複数の primitive が持つトークン参照 prop も、指せる種別の並びは 1 通りに決まる", () => {
  /*
   * 実体の `TokenKindByProp` は同じ名前を後勝ちで 1 つにするので、primitive ごとに違う種別を
   * 宣言すると、型（並びの union）と実行時の値が黙って食い違う。
   */
  type IsUnion<T, U = T> = T extends unknown
    ? [U] extends [T]
      ? false
      : true
    : never;
  type AmbiguousProp = {
    [P in TokenPropName]: IsUnion<TokenPropKinds[P]> extends false ? never : P;
  }[TokenPropName];

  expectTypeOf<AmbiguousProp>().toEqualTypeOf<never>();
});

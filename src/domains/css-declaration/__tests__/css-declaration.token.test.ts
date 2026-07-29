import { expect, test } from "vitest";
import type { TokenRefs } from "../index";
import { TokenBackedProperty } from "../index";

/** カスタムプロパティ名の綴り方は出力層の知識なので、テストからも引数で渡す。 */
const tokenRefs = {
  ref: (kind, name) => `var(--${kind}-${name})`,
  typographyRef: (name, property) => `var(--typography-${name}-${property})`,
} satisfies TokenRefs;

test("トークン参照 prop はトークンの値ではなく var() 参照の宣言になる", () => {
  expect(TokenBackedProperty.declarations("gap", "md", tokenRefs)).toEqual([
    { property: "gap", value: "var(--spacing-md)" },
  ]);
});

test("未指定のトークン参照 prop は宣言を出力しない", () => {
  expect(
    TokenBackedProperty.declarations("background", undefined, tokenRefs),
  ).toEqual([]);
});

test("トークン参照 prop の値は仕様で定めたトークン種別から引かれる", () => {
  expect(
    TokenBackedProperty.declarations("border-radius", "lg", tokenRefs),
  ).toEqual([{ property: "border-radius", value: "var(--radius-lg)" }]);
});

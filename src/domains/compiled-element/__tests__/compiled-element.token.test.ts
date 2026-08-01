import { expect, test } from "vitest";
import type { TokenRefs } from "@/domains/css-declaration";
import { CssDeclarations } from "@/domains/css-declaration";
import type { Props } from "@/domains/node";
import { ResolvedProps } from "@/domains/resolved-props";
import { BoxElement, TextElement } from "../index";

/** カスタムプロパティ名の綴り方は出力層の知識なので、テストからも引数で渡す。 */
const tokenRefs = {
  ref: (kind, name) => `var(--${kind}-${name})`,
  typographyRef: (name, property) => `var(--typography-${name}-${property})`,
} satisfies TokenRefs;

function setupBoxStyle(props: Props): CssDeclarations {
  return CssDeclarations.from(
    BoxElement.declarations(
      ResolvedProps.resolve("Box", props),
      undefined,
      tokenRefs,
    ),
  );
}

function setupTextStyle(props: Props): CssDeclarations {
  return CssDeclarations.from(
    TextElement.declarations(ResolvedProps.resolve("Text", props), tokenRefs),
  );
}

test("トークン参照 prop はトークンの値ではなく var() 参照になる", () => {
  expect(setupBoxStyle({ gap: "md" }).gap).toBe("var(--spacing-md)");
});

test("未指定のトークン参照 prop は宣言を出力しない", () => {
  expect("background" in setupBoxStyle({})).toBe(false);
});

test("トークン参照 prop の値は仕様で定めたトークン種別から引かれる", () => {
  const style = setupBoxStyle({
    background: "primary",
    radius: "lg",
    shadow: "sm",
  });

  expect(style).toMatchObject({
    background: "var(--colors-primary)",
    "border-radius": "var(--radius-lg)",
    "box-shadow": "var(--shadows-sm)",
  });
});

test("Text の色もトークン参照になる", () => {
  expect(setupTextStyle({ color: "primary" }).color).toBe(
    "var(--colors-primary)",
  );
});

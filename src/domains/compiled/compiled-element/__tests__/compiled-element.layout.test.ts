import { expect, test } from "vitest";
import type { TokenRefs } from "@/domains/dcmp/css-declaration";
import { CssDeclarations } from "@/domains/dcmp/css-declaration";
import type { Props } from "@/domains/dcmp/node";
import { ResolvedProps } from "@/domains/dcmp/resolved-props";
import { Option } from "@/utils/Option";
import { BoxElement } from "../index";

/** カスタムプロパティ名の綴り方は出力層の知識なので、テストからも引数で渡す。 */
const tokenRefs = {
  ref: (kind, name) => `var(--${kind}-${name})`,
  typographyRef: (name, property) => `var(--typography-${name}-${property})`,
} satisfies TokenRefs;

function setupBoxStyle(props: Props): CssDeclarations {
  return CssDeclarations.from(
    BoxElement.declarations(
      ResolvedProps.resolve("Box", props),
      Option.none,
      tokenRefs,
    ),
  );
}

test("自由配置の Box は flex コンテナにならない", () => {
  const style = setupBoxStyle({ layout: "free" });

  expect(style).not.toHaveProperty("display");
  expect(style).not.toHaveProperty("flex-direction");
});

test("自由配置の Box も絶対配置の子の基準になる position を出す", () => {
  const style = setupBoxStyle({ layout: "free" });

  expect(style.position).toBe("relative");
});

test("自由配置の Box は間隔の宣言を出さない", () => {
  const free = setupBoxStyle({ layout: "free", gap: "md" });
  const column = setupBoxStyle({ layout: "column", gap: "md" });

  expect(free).not.toHaveProperty("gap");
  expect(column.gap).toBe("var(--spacing-md)");
});

test("自由配置の Box は揃えの宣言を出さない", () => {
  const free = setupBoxStyle({ layout: "free", align: "center" });
  const column = setupBoxStyle({ layout: "column", align: "center" });

  expect(free).not.toHaveProperty("align-items");
  expect(free).not.toHaveProperty("justify-content");
  expect(column["align-items"]).toBe("center");
});

test("自由配置の Box でも余白と装飾の宣言は出る", () => {
  const style = setupBoxStyle({
    layout: "free",
    paddingTop: "md",
    background: "primary",
  });

  expect(style.padding).toBe("var(--spacing-md) 0 0 0");
  expect(style.background).toBe("var(--colors-primary)");
});

test("自由配置の Box は子を並べる向きを持たない", () => {
  expect(
    BoxElement.childDirection(ResolvedProps.resolve("Box", { layout: "free" })),
  ).toEqual(Option.none);
});

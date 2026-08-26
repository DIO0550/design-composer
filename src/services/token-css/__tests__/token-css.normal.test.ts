import { expect, test } from "vitest";
import { TokenSet } from "@/domains/dcmp/token";
import { TokenCss } from "../index";

test("colors トークンは hex 値のまま CSS カスタムプロパティになる", () => {
  const tokens = {
    ...TokenSet.empty(),
    colors: { primary: "#3b82f6", "gray-900": "#111827" },
  };

  expect(TokenCss.variables(tokens)).toEqual({
    "--colors-primary": "#3b82f6",
    "--colors-gray-900": "#111827",
  });
});

test("alpha 付きの colors トークンは 8桁 hex のまま出力される", () => {
  const tokens = { ...TokenSet.empty(), colors: { overlay: "#0000001a" } };

  expect(TokenCss.variables(tokens)).toEqual({
    "--colors-overlay": "#0000001a",
  });
});

test("spacing トークンは px 単位付きの値になる", () => {
  const tokens = { ...TokenSet.empty(), spacing: { sm: 8, md: 16 } };

  expect(TokenCss.variables(tokens)).toEqual({
    "--spacing-sm": "8px",
    "--spacing-md": "16px",
  });
});

test("radius トークンは px 単位付きの値になる", () => {
  const tokens = { ...TokenSet.empty(), radius: { md: 8, full: 9999 } };

  expect(TokenCss.variables(tokens)).toEqual({
    "--radius-md": "8px",
    "--radius-full": "9999px",
  });
});

test("shadows トークンは x / y / blur / spread / color を並べた box-shadow 値に合成される", () => {
  const tokens = {
    ...TokenSet.empty(),
    shadows: { md: { x: 0, y: 4, blur: 12, spread: 2, color: "#00000026" } },
  };

  expect(TokenCss.variables(tokens)).toEqual({
    "--shadows-md": "0px 4px 12px 2px #00000026",
  });
});

test("typography トークンはフィールドごとの CSS カスタムプロパティへ展開される", () => {
  const tokens = {
    ...TokenSet.empty(),
    typography: {
      body: {
        fontSize: 16,
        lineHeight: 1.6,
        fontWeight: 400,
        fontFamily: "Inter, sans-serif",
      },
    },
  };

  expect(TokenCss.variables(tokens)).toEqual({
    "--typography-body-font-size": "16px",
    "--typography-body-line-height": "1.6",
    "--typography-body-font-weight": "400",
    "--typography-body-font-family": "Inter, sans-serif",
  });
});

test("lineHeight は単位なしの倍率として出力される", () => {
  const tokens = {
    ...TokenSet.empty(),
    typography: {
      heading: { fontSize: 24, lineHeight: 1.4, fontWeight: 700 },
    },
  };

  expect(TokenCss.variables(tokens)["--typography-heading-line-height"]).toBe(
    "1.4",
  );
});

test("トークン種別と名前から CSS カスタムプロパティ名が決まる", () => {
  expect(TokenCss.variableName("colors", "primary")).toBe("--colors-primary");
  expect(TokenCss.variableName("spacing", "md")).toBe("--spacing-md");
});

test("トークン参照は var() 形式で出力される", () => {
  expect(TokenCss.ref("shadows", "sm")).toBe("var(--shadows-sm)");
});

test("typography の参照は CSS プロパティ単位の var() になる", () => {
  expect(TokenCss.typographyVariableName("body", "font-size")).toBe(
    "--typography-body-font-size",
  );
  expect(TokenCss.typographyRef("body", "font-weight")).toBe(
    "var(--typography-body-font-weight)",
  );
});

test("style 属性向けの文字列は宣言をセミコロン区切りで並べたものになる", () => {
  const tokens = {
    ...TokenSet.empty(),
    colors: { white: "#ffffff" },
    spacing: { xs: 4 },
  };

  expect(TokenCss.toStyleText(tokens)).toBe(
    "--colors-white:#ffffff;--spacing-xs:4px",
  );
});

test("出力される種別の順序は TokenSet の種別順に従う", () => {
  const tokens = {
    ...TokenSet.empty(),
    colors: { white: "#ffffff" },
    spacing: { xs: 4 },
    radius: { sm: 4 },
    shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0000001a" } },
    typography: { body: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 } },
  };

  expect(Object.keys(TokenCss.variables(tokens))).toEqual([
    "--colors-white",
    "--spacing-xs",
    "--radius-sm",
    "--shadows-sm",
    "--typography-body-font-size",
    "--typography-body-line-height",
    "--typography-body-font-weight",
    "--typography-body-font-family",
  ]);
});

test("同じトークンから何度変換しても同じ出力になる", () => {
  const tokens = {
    ...TokenSet.empty(),
    colors: { primary: "#3b82f6" },
    shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0000001a" } },
  };

  expect(TokenCss.toStyleText(tokens)).toBe(TokenCss.toStyleText(tokens));
});

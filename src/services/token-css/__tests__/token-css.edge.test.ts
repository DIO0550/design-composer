import { expect, test } from "vitest";
import { TokenSet } from "@/domains/token";
import { Font } from "@/utils/Font";
import { TokenCss } from "../index";

test("空のトークンセットからは変数が1つも出力されない", () => {
  expect(TokenCss.variables(TokenSet.empty())).toEqual({});
});

test("空のトークンセットの style 文字列は空になる", () => {
  expect(TokenCss.toStyleText(TokenSet.empty())).toBe("");
});

test("shadows の spread を省略すると 0px として合成される", () => {
  const tokens = {
    ...TokenSet.empty(),
    shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0000001a" } },
  };

  expect(TokenCss.variables(tokens)["--shadows-sm"]).toBe(
    "0px 1px 3px 0px #0000001a",
  );
});

test("shadows のオフセットが負の値でも符号付きの px として出力される", () => {
  const tokens = {
    ...TokenSet.empty(),
    shadows: {
      inset: { x: -2, y: -4, blur: 8, spread: -1, color: "#00000033" },
    },
  };

  expect(TokenCss.variables(tokens)["--shadows-inset"]).toBe(
    "-2px -4px 8px -1px #00000033",
  );
});

test("小数を持つ spacing トークンは小数のまま px 化される", () => {
  const tokens = { ...TokenSet.empty(), spacing: { hairline: 0.5 } };

  expect(TokenCss.variables(tokens)["--spacing-hairline"]).toBe("0.5px");
});

test("値が 0 の spacing トークンも px 付きで出力される", () => {
  const tokens = { ...TokenSet.empty(), spacing: { none: 0 } };

  expect(TokenCss.variables(tokens)["--spacing-none"]).toBe("0px");
});

test("typography の fontFamily を省略するとシステムフォントスタックが出力される", () => {
  const tokens = {
    ...TokenSet.empty(),
    typography: { body: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 } },
  };

  expect(TokenCss.variables(tokens)["--typography-body-font-family"]).toBe(
    Font.systemStack(),
  );
});

test("fontFamily を省略しても展開される変数の数は指定時と変わらない", () => {
  const withFamily = {
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
  const withoutFamily = {
    ...TokenSet.empty(),
    typography: { body: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 } },
  };

  expect(Object.keys(TokenCss.variables(withoutFamily))).toEqual(
    Object.keys(TokenCss.variables(withFamily)),
  );
});

test("種別が違えば同名のトークンでも別の変数として出力される", () => {
  const tokens = {
    ...TokenSet.empty(),
    spacing: { md: 16 },
    radius: { md: 8 },
  };

  expect(TokenCss.variables(tokens)).toEqual({
    "--spacing-md": "16px",
    "--radius-md": "8px",
  });
});

test("ハイフンを含むトークン名はそのまま変数名に連結される", () => {
  const tokens = {
    ...TokenSet.empty(),
    colors: { "primary-dark": "#1d4ed8" },
  };

  expect(TokenCss.variables(tokens)).toEqual({
    "--colors-primary-dark": "#1d4ed8",
  });
});

test("トークンを変換しても元のトークンセットは変更されない", () => {
  const tokens = {
    ...TokenSet.empty(),
    spacing: { md: 16 },
  };

  TokenCss.variables(tokens);

  expect(tokens.spacing).toEqual({ md: 16 });
});

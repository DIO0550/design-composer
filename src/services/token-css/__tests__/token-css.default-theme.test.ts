import { expect, test } from "vitest";
import type { TokenSet } from "@/domains/dcmp/token";
import { Font } from "@/utils/Font";
import { TokenCss } from "../index";

/** docs/04-tokens.md「初期トークンセット(デフォルトテーマ)」の全体。 */
function setupDefaultTheme(): TokenSet {
  return {
    colors: {
      white: "#ffffff",
      "gray-100": "#f3f4f6",
      "gray-300": "#d1d5db",
      "gray-500": "#6b7280",
      "gray-700": "#374151",
      "gray-900": "#111827",
      primary: "#3b82f6",
      "primary-dark": "#1d4ed8",
      danger: "#ef4444",
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    radius: { sm: 4, md: 8, lg: 16, full: 9999 },
    shadows: {
      sm: { x: 0, y: 1, blur: 3, color: "#0000001a" },
      md: { x: 0, y: 4, blur: 12, color: "#00000026" },
      lg: { x: 0, y: 8, blur: 24, color: "#00000033" },
    },
    typography: {
      heading: { fontSize: 24, lineHeight: 1.4, fontWeight: 700 },
      subheading: { fontSize: 18, lineHeight: 1.5, fontWeight: 600 },
      body: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 },
      caption: { fontSize: 12, lineHeight: 1.4, fontWeight: 400 },
    },
  };
}

test("初期トークンセット全体が CSS カスタムプロパティへ変換される", () => {
  expect(TokenCss.variables(setupDefaultTheme())).toEqual({
    "--colors-white": "#ffffff",
    "--colors-gray-100": "#f3f4f6",
    "--colors-gray-300": "#d1d5db",
    "--colors-gray-500": "#6b7280",
    "--colors-gray-700": "#374151",
    "--colors-gray-900": "#111827",
    "--colors-primary": "#3b82f6",
    "--colors-primary-dark": "#1d4ed8",
    "--colors-danger": "#ef4444",
    "--spacing-xs": "4px",
    "--spacing-sm": "8px",
    "--spacing-md": "16px",
    "--spacing-lg": "24px",
    "--spacing-xl": "32px",
    "--radius-sm": "4px",
    "--radius-md": "8px",
    "--radius-lg": "16px",
    "--radius-full": "9999px",
    "--shadows-sm": "0px 1px 3px 0px #0000001a",
    "--shadows-md": "0px 4px 12px 0px #00000026",
    "--shadows-lg": "0px 8px 24px 0px #00000033",
    "--typography-heading-font-size": "24px",
    "--typography-heading-line-height": "1.4",
    "--typography-heading-font-weight": "700",
    "--typography-heading-font-family": Font.systemStack(),
    "--typography-subheading-font-size": "18px",
    "--typography-subheading-line-height": "1.5",
    "--typography-subheading-font-weight": "600",
    "--typography-subheading-font-family": Font.systemStack(),
    "--typography-body-font-size": "16px",
    "--typography-body-line-height": "1.6",
    "--typography-body-font-weight": "400",
    "--typography-body-font-family": Font.systemStack(),
    "--typography-caption-font-size": "12px",
    "--typography-caption-line-height": "1.4",
    "--typography-caption-font-weight": "400",
    "--typography-caption-font-family": Font.systemStack(),
  });
});

test("初期トークンセットは同じ CSS 文字列へ決定的に変換される", () => {
  expect(TokenCss.toStyleText(setupDefaultTheme())).toBe(
    TokenCss.toStyleText(setupDefaultTheme()),
  );
});

test("初期トークンセットの全トークンが style 文字列に現れる", () => {
  const theme = setupDefaultTheme();
  const styleText = TokenCss.toStyleText(theme);

  expect(styleText.split(";")).toHaveLength(
    Object.keys(TokenCss.variables(theme)).length,
  );
});

import { expect, test } from "vitest";
import { ColorToken, TokenSet } from "@/domains/token";
import { DocumentTemplate } from "../index";

test("デフォルトテーマは仕様の初期カラーパレットを持つ", () => {
  expect(DocumentTemplate.DEFAULT.tokens.colors).toEqual({
    white: "#ffffff",
    "gray-100": "#f3f4f6",
    "gray-300": "#d1d5db",
    "gray-500": "#6b7280",
    "gray-700": "#374151",
    "gray-900": "#111827",
    primary: "#3b82f6",
    "primary-dark": "#1d4ed8",
    danger: "#ef4444",
  });
});

test("デフォルトテーマの色はすべて正規形の hex で書かれている", () => {
  const { colors } = DocumentTemplate.DEFAULT.tokens;

  const invalid = Object.values(colors).filter(
    (color) => !ColorToken.isValid(color),
  );

  expect(invalid).toEqual([]);
});

test("デフォルトテーマは xs から xl までの5段の spacing を持つ", () => {
  expect(DocumentTemplate.DEFAULT.tokens.spacing).toEqual({
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  });
});

test("デフォルトテーマは sm から full までの4段の radius を持つ", () => {
  expect(DocumentTemplate.DEFAULT.tokens.radius).toEqual({
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
  });
});

test("デフォルトテーマは sm / md / lg の3段の shadows を持つ", () => {
  expect(DocumentTemplate.DEFAULT.tokens.shadows).toEqual({
    sm: { x: 0, y: 1, blur: 3, color: "#0000001a" },
    md: { x: 0, y: 4, blur: 12, color: "#00000026" },
    lg: { x: 0, y: 8, blur: 24, color: "#00000033" },
  });
});

test("デフォルトテーマは heading / subheading / body / caption の4種の typography を持つ", () => {
  expect(DocumentTemplate.DEFAULT.tokens.typography).toEqual({
    heading: { fontSize: 24, lineHeight: 1.4, fontWeight: 700 },
    subheading: { fontSize: 18, lineHeight: 1.5, fontWeight: 600 },
    body: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 },
    caption: { fontSize: 12, lineHeight: 1.4, fontWeight: 400 },
  });
});

test("デフォルトテーマはトークン種別を1つも空にしない", () => {
  const { tokens } = DocumentTemplate.DEFAULT;

  const emptyKinds = TokenSet.kinds().filter(
    (kind) => TokenSet.names(tokens, kind).length === 0,
  );

  expect(emptyKinds).toEqual([]);
});

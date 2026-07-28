import type { ShadowToken } from "./shadow";
import type { TypographyToken } from "./typography";

export { type BoxShadowValue, ShadowToken } from "./shadow";
export {
  type TypographyCssProperty,
  TypographyField,
  TypographyFieldRef,
  TypographyToken,
} from "./typography";

export type ColorToken = string;
export type SpacingToken = number;
export type RadiusToken = number;

export type TokenSet = Readonly<{
  colors: Readonly<Record<string, ColorToken>>;
  spacing: Readonly<Record<string, SpacingToken>>;
  radius: Readonly<Record<string, RadiusToken>>;
  shadows: Readonly<Record<string, ShadowToken>>;
  typography: Readonly<Record<string, TypographyToken>>;
}>;

/**
 * 種別の走査に使う実行時のリスト。`TokenKind` はここから導出し、種別を二重管理しない。
 * `satisfies` で TokenSet のキー以外が混ざらないことを、
 * 種別の網羅は `__tests__/token.type.test.ts` の型テストで担保する。
 */
const TOKEN_KINDS = [
  "colors",
  "spacing",
  "radius",
  "shadows",
  "typography",
] as const satisfies readonly (keyof TokenSet)[];

export type TokenKind = (typeof TOKEN_KINDS)[number];

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}([0-9a-f]{2})?$/;

/** 大文字の hex も受ける版。正規化の対象かどうかの判定にだけ使う。 */
const ANY_CASE_HEX_COLOR_PATTERN = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;

export const TokenSet = {
  empty(): TokenSet {
    return { colors: {}, spacing: {}, radius: {}, shadows: {}, typography: {} };
  },

  isValidColor(value: string): boolean {
    return HEX_COLOR_PATTERN.test(value);
  },

  /**
   * 色の正規形は小文字の hex(docs/04-tokens.md「小文字に正規化」)。
   * 同値異表記の併存を防ぐため、hex として読める値だけを小文字へ倒す。
   * hex でない値は正規形が定義できないので、意味を変えずそのまま返す
   * (不正値としての報告はバリデーションの担当)。
   */
  normalizeColor(value: string): string {
    return ANY_CASE_HEX_COLOR_PATTERN.test(value) ? value.toLowerCase() : value;
  },

  has(tokens: TokenSet, kind: TokenKind, name: string): boolean {
    return name in tokens[kind];
  },

  kinds(): readonly TokenKind[] {
    return TOKEN_KINDS;
  },

  names(tokens: TokenSet, kind: TokenKind): readonly string[] {
    return Object.keys(tokens[kind]);
  },
} as const;

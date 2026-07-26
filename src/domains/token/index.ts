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

export const TokenSet = {
  empty(): TokenSet {
    return { colors: {}, spacing: {}, radius: {}, shadows: {}, typography: {} };
  },

  isValidColor(value: string): boolean {
    return HEX_COLOR_PATTERN.test(value);
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

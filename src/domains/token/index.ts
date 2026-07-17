export type ColorToken = string;
export type SpacingToken = number;
export type RadiusToken = number;

export type ShadowToken = Readonly<{
  x: number;
  y: number;
  blur: number;
  spread?: number;
  color: string;
}>;

export type TypographyToken = Readonly<{
  fontSize: number;
  lineHeight: number;
  fontWeight: number;
  fontFamily?: string;
}>;

export type TokenKind =
  | "colors"
  | "spacing"
  | "radius"
  | "shadows"
  | "typography";

export type TokenSet = Readonly<{
  colors: Readonly<Record<string, ColorToken>>;
  spacing: Readonly<Record<string, SpacingToken>>;
  radius: Readonly<Record<string, RadiusToken>>;
  shadows: Readonly<Record<string, ShadowToken>>;
  typography: Readonly<Record<string, TypographyToken>>;
}>;

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
} as const;

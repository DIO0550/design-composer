import {
  type ShadowToken,
  type TokenKind,
  TokenSet,
  type TypographyToken,
} from "@/domains/token";

/**
 * CSS カスタムプロパティ名 → 値の対応。
 * ルート要素の style へそのまま展開できる形で持つ。
 */
export type CssVariables = Readonly<Record<string, string>>;

/**
 * 1トークンが1つの CSS 値に対応する種別。
 * typography だけは複数の CSS プロパティへ展開されるため単一の変数名を持てず、
 * この型から除外することで `variableName` の誤用を型で防ぐ。
 */
export type SingleValueTokenKind = Exclude<TokenKind, "typography">;

/**
 * typography トークンのフィールドと展開先 CSS プロパティ名の対応。
 * `satisfies` で TypographyToken に無いフィールドが混ざらないことを、
 * フィールドの網羅は `__tests__/token-css.type.test.ts` の型テストで担保する。
 */
const TYPOGRAPHY_CSS_PROPERTIES = [
  { field: "fontSize", property: "font-size" },
  { field: "lineHeight", property: "line-height" },
  { field: "fontWeight", property: "font-weight" },
  { field: "fontFamily", property: "font-family" },
] as const satisfies readonly {
  readonly field: keyof Required<TypographyToken>;
  readonly property: string;
}[];

export type TypographyCssField =
  (typeof TYPOGRAPHY_CSS_PROPERTIES)[number]["field"];

export type TypographyCssProperty =
  (typeof TYPOGRAPHY_CSS_PROPERTIES)[number]["property"];

/**
 * fontFamily 省略時に用いるシステムフォントスタック(docs/04-tokens.md)。
 * 省略時も変数を必ず出力することで、参照側が `var()` のフォールバックを持たずに済む。
 */
const SYSTEM_FONT_STACK =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

function px(value: number): string {
  return `${value}px`;
}

function shadowValue(shadow: ShadowToken): string {
  return [
    px(shadow.x),
    px(shadow.y),
    px(shadow.blur),
    px(shadow.spread ?? 0),
    shadow.color,
  ].join(" ");
}

function typographyValue(
  token: TypographyToken,
  field: TypographyCssField,
): string {
  switch (field) {
    case "fontSize":
      return px(token.fontSize);
    case "lineHeight":
      return String(token.lineHeight);
    case "fontWeight":
      return String(token.fontWeight);
    case "fontFamily":
      return token.fontFamily ?? SYSTEM_FONT_STACK;
  }
}

type CssVariableEntry = readonly [string, string];

function entriesOfKind(
  tokens: TokenSet,
  kind: TokenKind,
): readonly CssVariableEntry[] {
  switch (kind) {
    case "colors":
      return Object.entries(tokens.colors).map(([name, value]) => [
        TokenCss.variableName(kind, name),
        value,
      ]);
    case "spacing":
    case "radius":
      return Object.entries(tokens[kind]).map(([name, value]) => [
        TokenCss.variableName(kind, name),
        px(value),
      ]);
    case "shadows":
      return Object.entries(tokens.shadows).map(([name, shadow]) => [
        TokenCss.variableName(kind, name),
        shadowValue(shadow),
      ]);
    case "typography":
      return Object.entries(tokens.typography).flatMap(([name, token]) =>
        TYPOGRAPHY_CSS_PROPERTIES.map(
          ({ field, property }): CssVariableEntry => [
            TokenCss.typographyVariableName(name, property),
            typographyValue(token, field),
          ],
        ),
      );
  }
}

export const TokenCss = {
  variableName(kind: SingleValueTokenKind, name: string): string {
    return `--${kind}-${name}`;
  },

  ref(kind: SingleValueTokenKind, name: string): string {
    return `var(${TokenCss.variableName(kind, name)})`;
  },

  typographyVariableName(
    name: string,
    property: TypographyCssProperty,
  ): string {
    return `--typography-${name}-${property}`;
  },

  typographyRef(name: string, property: TypographyCssProperty): string {
    return `var(${TokenCss.typographyVariableName(name, property)})`;
  },

  /**
   * トークン全体を CSS カスタムプロパティへ変換する。
   * 種別は `TokenSet.kinds()` の順、種別内は TokenSet が持つ定義順を保つ
   * (同じ入力からは常に同じ出力になる)。
   */
  variables(tokens: TokenSet): CssVariables {
    return Object.fromEntries(
      TokenSet.kinds().flatMap((kind) => entriesOfKind(tokens, kind)),
    );
  },

  /** `variables` を style 属性へ載せられる宣言の並びに直列化する。 */
  toStyleText(tokens: TokenSet): string {
    return Object.entries(TokenCss.variables(tokens))
      .map(([name, value]) => `${name}:${value}`)
      .join(";");
  },
} as const;

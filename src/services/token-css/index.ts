import {
  type ShadowToken,
  type TokenKind,
  TokenSet,
  type TypographyField,
  TypographyToken,
} from "@/domains/token";

/**
 * CSS カスタムプロパティ名 → 値の対応。
 * ルート要素の style へそのまま展開できる形で持つ。
 */
export type CssVariables = Readonly<Record<string, string>>;

/**
 * 1トークンが1つのカスタムプロパティで表せる種別。
 * shadows はドメイン上は複合トークンだが `box-shadow` の1値へ合成できるため含む。
 * typography だけは別々の CSS プロパティへ展開されるため単一の変数名を持てず、
 * この型から除外することで `variableName` の誤用を型で防ぐ。
 * (ドメインの scalar / 複合の区別ではなく CSS への出力単位による区別なので、
 *  token ドメインではなくこのモジュールが持つ)
 */
export type SingleVariableTokenKind = Exclude<TokenKind, "typography">;

/**
 * typography トークンのフィールドを、展開先の CSS プロパティ名へ対応付ける。
 * フィールドの列挙自体は token ドメイン(`TypographyField`)が持ち、ここは
 * 「どの CSS プロパティになるか」だけを持つ。`satisfies` により、
 * ドメインにフィールドが増えたらこの対応表もコンパイルエラーで漏れが分かる。
 */
const TYPOGRAPHY_CSS_PROPERTIES = {
  fontSize: "font-size",
  lineHeight: "line-height",
  fontWeight: "font-weight",
  fontFamily: "font-family",
} as const satisfies Readonly<Record<TypographyField, string>>;

export type TypographyCssProperty =
  (typeof TYPOGRAPHY_CSS_PROPERTIES)[TypographyField];

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
  field: TypographyField,
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
        TypographyToken.fields().map(
          (field): CssVariableEntry => [
            TokenCss.typographyVariableName(
              name,
              TYPOGRAPHY_CSS_PROPERTIES[field],
            ),
            typographyValue(token, field),
          ],
        ),
      );
  }
}

export const TokenCss = {
  variableName(kind: SingleVariableTokenKind, name: string): string {
    return `--${kind}-${name}`;
  },

  ref(kind: SingleVariableTokenKind, name: string): string {
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

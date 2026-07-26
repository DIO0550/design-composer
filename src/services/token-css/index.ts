import { CssDeclarations } from "@/domains/css-declaration";
import { Px } from "@/domains/px";
import {
  ShadowToken,
  type TokenKind,
  TokenSet,
  type TypographyCssProperty,
  TypographyFieldRef,
  TypographyToken,
} from "@/domains/token";

/** CSS カスタムプロパティ名。 */
export type CssVariableName = `--${string}`;

/** `var()` によるカスタムプロパティ参照。 */
export type CssVariableReference = `var(${CssVariableName})`;

/**
 * CSS カスタムプロパティ名 → 値の対応。
 * ルート要素の style へそのまま展開できる形で持つ。
 */
export type CssVariables = Readonly<Record<CssVariableName, string>>;

/**
 * 1トークンが1つのカスタムプロパティで表せる種別。
 * shadows はドメイン上は複合トークンだが `box-shadow` の1値へ合成できるため含む。
 * typography だけは別々の CSS プロパティへ展開されるため単一の変数名を持てず、
 * この型から除外することで `variableName` の誤用を型で防ぐ。
 * (ドメインの scalar / 複合の区別ではなく CSS への出力単位による区別なので、
 *  token ドメインではなくこのモジュールが持つ)
 */
export type SingleVariableTokenKind = Exclude<TokenKind, "typography">;

type CssVariableEntry = readonly [CssVariableName, string];

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
        Px.create(value),
      ]);
    case "shadows":
      return Object.entries(tokens.shadows).map(([name, shadow]) => [
        TokenCss.variableName(kind, name),
        ShadowToken.cssValue(shadow),
      ]);
    case "typography":
      return Object.entries(tokens.typography).flatMap(([name, token]) =>
        TypographyToken.fields().map((field): CssVariableEntry => {
          const ref = TypographyFieldRef.create(token, field);
          return [
            TokenCss.typographyVariableName(
              name,
              TypographyFieldRef.cssProperty(ref),
            ),
            TypographyFieldRef.cssValue(ref),
          ];
        }),
      );
  }
}

export const TokenCss = {
  variableName(kind: SingleVariableTokenKind, name: string): CssVariableName {
    return `--${kind}-${name}`;
  },

  ref(kind: SingleVariableTokenKind, name: string): CssVariableReference {
    return `var(${TokenCss.variableName(kind, name)})`;
  },

  typographyVariableName(
    name: string,
    property: TypographyCssProperty,
  ): CssVariableName {
    return `--typography-${name}-${property}`;
  },

  typographyRef(
    name: string,
    property: TypographyCssProperty,
  ): CssVariableReference {
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
    return CssDeclarations.toStyleText(TokenCss.variables(tokens));
  },
} as const;

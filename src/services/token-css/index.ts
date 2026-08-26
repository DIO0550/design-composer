import type {
  CssVariableName,
  SingleVariableTokenKind,
  TokenRefs,
} from "@/domains/dcmp/css-declaration";
import { CssDeclarations } from "@/domains/dcmp/css-declaration";
import {
  ShadowToken,
  type TokenKind,
  TokenSet,
  type TypographyCssProperty,
  TypographyFieldRef,
  TypographyToken,
} from "@/domains/dcmp/token";
import { Px } from "@/domains/unit/px";

export type { CssVariableName, SingleVariableTokenKind };

/** `var()` によるカスタムプロパティ参照。 */
export type CssVariableReference = `var(${CssVariableName})`;

/**
 * CSS カスタムプロパティ名 → 値の対応。
 * ルート要素の style へそのまま展開できる形で持つ。
 */
export type CssVariables = Readonly<Record<CssVariableName, string>>;

type CssVariableEntry = readonly [CssVariableName, string];

/**
 * その種別のトークンを、カスタムプロパティ名と値の対の並びにする。
 *
 * @param tokens 書き出し元のトークン一式
 * @param kind 書き出す種別
 * @returns カスタムプロパティ名と値の対の並び
 */
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

/** トークンを CSS カスタムプロパティの名前・宣言・`var()` 参照へ変換する。 */
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

  /**
   * ドメインへ渡すトークン参照の綴り方。
   * カスタムプロパティ名の規則はこの層の知識なので、参照を作る側はこれを通す。
   */
  refs: {
    ref: (kind: SingleVariableTokenKind, name: string): string =>
      TokenCss.ref(kind, name),
    typographyRef: (name: string, property: TypographyCssProperty): string =>
      TokenCss.typographyRef(name, property),
  } satisfies TokenRefs,
} as const;

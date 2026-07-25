import { Css } from "@/utils/Css";
import { Font } from "@/utils/Font";

export type TypographyToken = Readonly<{
  fontSize: number;
  lineHeight: number;
  fontWeight: number;
  fontFamily?: string;
}>;

/**
 * フィールドの走査に使う実行時のリスト。`TypographyField` はここから導出し、
 * フィールドを二重管理しない。`satisfies` で TypographyToken に無いフィールドが
 * 混ざらないことを、網羅は `__tests__/typography.type.test.ts` の型テストで担保する。
 */
const TYPOGRAPHY_FIELDS = [
  "fontSize",
  "lineHeight",
  "fontWeight",
  "fontFamily",
] as const satisfies readonly (keyof Required<TypographyToken>)[];

export type TypographyField = (typeof TYPOGRAPHY_FIELDS)[number];

/**
 * フィールドと、展開先の CSS プロパティ名の対応。
 * `satisfies` により、フィールドを増やしたらこの対応表の漏れがコンパイルエラーになる。
 */
const CSS_PROPERTIES = {
  fontSize: "font-size",
  lineHeight: "line-height",
  fontWeight: "font-weight",
  fontFamily: "font-family",
} as const satisfies Readonly<Record<TypographyField, string>>;

export type TypographyCssProperty = (typeof CSS_PROPERTIES)[TypographyField];

/**
 * typography トークンの1フィールドを指す。
 * 「どのトークンの」「どのフィールドか」は常に対で意味を持つため1つの型にまとめる。
 */
export type TypographyFieldRef = Readonly<{
  token: TypographyToken;
  field: TypographyField;
}>;

export const TypographyToken = {
  fields(): readonly TypographyField[] {
    return TYPOGRAPHY_FIELDS;
  },

  cssProperty(field: TypographyField): TypographyCssProperty {
    return CSS_PROPERTIES[field];
  },

  /** フォントファミリ省略時はシステムフォントスタックを既定値とする(docs/04-tokens.md)。 */
  fontFamilyOf(token: TypographyToken): string {
    return token.fontFamily ?? Font.systemStack();
  },

  cssValue({ token, field }: TypographyFieldRef): string {
    switch (field) {
      case "fontSize":
        return Css.px(token.fontSize);
      case "lineHeight":
        return String(token.lineHeight);
      case "fontWeight":
        return String(token.fontWeight);
      case "fontFamily":
        return TypographyToken.fontFamilyOf(token);
    }
  },
} as const;

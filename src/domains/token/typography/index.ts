import { Px } from "@/domains/px";
import { Font } from "@/utils/Font";
import { Json, type JsonDecoded, type JsonObject } from "@/utils/Json";
import { Result } from "@/utils/Result";

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

export const TypographyField = {
  /**
   * 展開先の CSS プロパティ名。トークンの値には依存しないため、
   * 参照だけを組み立てる用途(`var()` 参照の生成)ではトークンを持たずに引ける。
   */
  cssProperty(field: TypographyField): TypographyCssProperty {
    return CSS_PROPERTIES[field];
  },
} as const;

export const TypographyToken = {
  fields(): readonly TypographyField[] {
    return TYPOGRAPHY_FIELDS;
  },

  /** フォントファミリ省略時はシステムフォントスタックを既定値とする(docs/04-tokens.md)。 */
  fontFamilyOf(token: TypographyToken): string {
    return token.fontFamily ?? Font.systemStack();
  },

  fromJson(value: unknown, path: string): JsonDecoded<TypographyToken> {
    return Result.flatMap(Json.record(value, path), (record) =>
      Json.knownFields(
        Json.combine4(
          Json.required(record, path, "fontSize", Json.number),
          Json.required(record, path, "lineHeight", Json.number),
          Json.required(record, path, "fontWeight", Json.number),
          Json.optional(record, path, "fontFamily", Json.string),
          (fontSize, lineHeight, fontWeight, fontFamily) => ({
            fontSize,
            lineHeight,
            fontWeight,
            ...(fontFamily !== undefined ? { fontFamily } : {}),
          }),
        ),
        record,
        path,
        TYPOGRAPHY_FIELDS,
      ),
    );
  },

  /** 省略された fontFamily は書き戻さない(既定値の書き出しを避ける)。 */
  toJson(token: TypographyToken): JsonObject {
    return {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      fontWeight: token.fontWeight,
      ...Json.definedField("fontFamily", token.fontFamily),
    };
  },
} as const;

/**
 * typography トークンの1フィールドを指す。
 * 「どのトークンの」「どのフィールドか」は常に対で意味を持つため1つの型にまとめる。
 * どの CSS プロパティになるか・どんな値になるかは、この対が決まって初めて定まる。
 */
export type TypographyFieldRef = Readonly<{
  token: TypographyToken;
  field: TypographyField;
}>;

export const TypographyFieldRef = {
  create(token: TypographyToken, field: TypographyField): TypographyFieldRef {
    return { token, field };
  },

  cssProperty(ref: TypographyFieldRef): TypographyCssProperty {
    return TypographyField.cssProperty(ref.field);
  },

  cssValue(ref: TypographyFieldRef): string {
    switch (ref.field) {
      case "fontSize":
        return Px.create(ref.token.fontSize);
      case "lineHeight":
        return String(ref.token.lineHeight);
      case "fontWeight":
        return String(ref.token.fontWeight);
      case "fontFamily":
        return TypographyToken.fontFamilyOf(ref.token);
    }
  },
} as const;

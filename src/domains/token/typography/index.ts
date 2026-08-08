import { Px } from "@/domains/px";
import { Font } from "@/utils/Font";
import {
  Json,
  type JsonCursor,
  type JsonDecoded,
  type JsonObject,
} from "@/utils/Json";
import type { Option } from "@/utils/Option";
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
 * 書体の1フィールドの書き換え。
 * フィールドごとに値の型が違うので直和にして、「fontSize に文字列」を
 * 型で表現できなくする。`fontFamily` の不在は `Option` で受ける
 * (空文字を不在と読むのは入力欄の約束事なので、ドメインには持たせない)。
 */
export type TypographyFieldEdit =
  | Readonly<{
      field: "fontSize" | "lineHeight" | "fontWeight";
      value: number;
    }>
  | Readonly<{ field: "fontFamily"; value: Option<string> }>;

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

/**
 * 不在のフォントファミリはキーごと落とす。
 * 既定値(システムフォントスタック)を書き込むと、指定していない値が
 * ファイルに残る(docs/04-tokens.md「省略時はシステムフォントスタック」)。
 */
function withFontFamily(
  token: TypographyToken,
  fontFamily: Option<string>,
): TypographyToken {
  return {
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    fontWeight: token.fontWeight,
    ...(fontFamily.some ? { fontFamily: fontFamily.value } : {}),
  };
}

export const TypographyToken = {
  fields(): readonly TypographyField[] {
    return TYPOGRAPHY_FIELDS;
  },

  /** フォントファミリ省略時はシステムフォントスタックを既定値とする(docs/04-tokens.md)。 */
  fontFamilyOf(token: TypographyToken): string {
    return token.fontFamily ?? Font.systemStack();
  },

  /**
   * 1フィールドだけ差し替えた書体を返す。
   *
   * 値域(fontWeight は仕様上 100–900、fontSize / lineHeight は正の数)はここで
   * 縛っていない。不正な値をどう見せるかが UI 案にも #126 にも無く、
   * 表示の形と対でしか決められないため(縛るのは #143)。
   */
  withField(
    token: TypographyToken,
    edit: TypographyFieldEdit,
  ): TypographyToken {
    switch (edit.field) {
      case "fontSize":
        return { ...token, fontSize: edit.value };
      case "lineHeight":
        return { ...token, lineHeight: edit.value };
      case "fontWeight":
        return { ...token, fontWeight: edit.value };
      case "fontFamily":
        return withFontFamily(token, edit.value);
    }
  },

  fromJson(cursor: JsonCursor): JsonDecoded<TypographyToken> {
    return Result.flatMap(Json.record(cursor), (record) =>
      Json.knownFields(
        Json.combine4(
          Json.required(record, "fontSize", Json.number),
          Json.required(record, "lineHeight", Json.number),
          Json.required(record, "fontWeight", Json.number),
          Json.optional(record, "fontFamily", Json.string),
          (fontSize, lineHeight, fontWeight, fontFamily) => ({
            fontSize,
            lineHeight,
            fontWeight,
            ...(fontFamily !== undefined ? { fontFamily } : {}),
          }),
        ),
        record,
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

import { Px } from "@/domains/unit/px";
import type { Brand } from "@/types/Brand";
import type { ValueOf } from "@/types/ValueOf";
import { Font } from "@/utils/Font";
import {
  Json,
  type JsonCursor,
  type JsonDecoded,
  type JsonObject,
} from "@/utils/Json";
import { NumberEx } from "@/utils/NumberEx";
import { Option } from "@/utils/Option";
import { Range } from "@/utils/Range";
import { Result } from "@/utils/Result";

/*
 * 値域付きの型どうしを別物にするための目印。`unique symbol` は宣言した場所ごとに
 * 別の型になるので、3 つを別々に宣言することでサイズ・行間・太さの取り違えが
 * 型で弾ける（`src/types/Brand.ts`）。値は持たないので実行時には何も残らない。
 */
declare const FontSizeBrand: unique symbol;
declare const LineHeightBrand: unique symbol;
declare const FontWeightBrand: unique symbol;

/**
 * 書体のトークン（docs/04-tokens.md「typography」）。`fontFamily` だけ省略できる。
 *
 * 数値のフィールドが値域付きの型（`FontSize` 等）ではなく素の `number` なのは、
 * 既にファイルに入っている値をそのまま読むため（#143 の決定 D）。値域付きにすると
 * `fromJson` が範囲外を読んだときに、読み込みを失敗させるか `as` で嘘をつくかの
 * どちらかになる。値域を課すのは編集で受け取る側（`TypographyFieldEdit`）。
 */
export type TypographyToken = Readonly<{
  fontSize: number;
  lineHeight: number;
  fontWeight: number;
  fontFamily?: string;
}>;

/**
 * 書体の大きさ（docs/04-tokens.md「typography」の `fontSize`）。単位は px。
 *
 * 素の `number` と構造が変わらないのでブランドで隔てている。数値は `Px` のような
 * テンプレートリテラル型で構造を狭められず、これが無いと `create` を通らない値が
 * 同じ顔で編集へ流れる。
 */
export type FontSize = Brand<number, typeof FontSizeBrand>;

export const FontSize = {
  /**
   * @param value 書体の大きさにしたい数値
   * @returns 有限で 0 より大きいときだけ some。0 以下は文字が出ず、大きさとして意味を持たない
   */
  create(value: number): Option<FontSize> {
    return NumberEx.isFinitePositive(value)
      ? Option.some(value as FontSize)
      : Option.none;
  },
} as const;

/** 行の高さ（docs/04-tokens.md「typography」の `lineHeight`）。単位なしの倍率。 */
export type LineHeight = Brand<number, typeof LineHeightBrand>;

export const LineHeight = {
  /**
   * @param value 行の高さにしたい倍率
   * @returns 有限で 0 より大きいときだけ some。0 は全行が高さ 0 に潰れる
   */
  create(value: number): Option<LineHeight> {
    return NumberEx.isFinitePositive(value)
      ? Option.some(value as LineHeight)
      : Option.none;
  },
} as const;

/** 書体の太さが取りうる範囲（docs/04-tokens.md「typography」の `fontWeight`）。 */
const FontWeightRange = { min: 100, max: 900 } as const satisfies Range;

/**
 * 書体の太さ（docs/04-tokens.md「typography」の `fontWeight`）。
 *
 * 100 刻みの 9 値ではなく 100–900 の範囲。docs が定めているのは型 `number` と
 * その範囲で、可変フォントの `450` も仕様の内側にある。
 */
export type FontWeight = Brand<number, typeof FontWeightBrand>;

export const FontWeight = {
  /**
   * @param value 書体の太さにしたい数値
   * @returns 100 以上 900 以下のときだけ some
   */
  create(value: number): Option<FontWeight> {
    return Range.contains(FontWeightRange, value)
      ? Option.some(value as FontWeight)
      : Option.none;
  },
} as const;

/**
 * フィールドを名前で指すための対応表。`TypographyField` はここから導出し、
 * フィールドを二重管理しない。過不足とキーの綴りは
 * `Record<Capitalize<keyof Required<TypographyToken>>, keyof Required<TypographyToken>>`
 * がコンパイルエラーにする。
 *
 * 並びが要るときは `TypographyToken.fields()` を使う。ここを直接走査する入口と
 * 分けているのは、並びの公開 API が既に `TypographyToken` 側にあるため。
 */
export const TypographyFields = {
  FontSize: "fontSize",
  LineHeight: "lineHeight",
  FontWeight: "fontWeight",
  FontFamily: "fontFamily",
} as const satisfies Readonly<
  Record<
    Capitalize<keyof Required<TypographyToken>>,
    keyof Required<TypographyToken>
  >
>;

/** 書体が持つフィールドの名前。 */
export type TypographyField = ValueOf<typeof TypographyFields>;

/**
 * 書体の1フィールドの書き換え。
 * フィールドごとに値の型が違うので直和にして、「fontSize に文字列」を
 * 型で表現できなくする。`fontFamily` の不在は `Option` で受ける
 * (空文字を不在と読むのは入力欄の約束事なので、ドメインには持たせない)。
 *
 * 数値の3フィールドを1つのメンバにまとめない。まとめると値の型も union になり、
 * 「fontSize の値を fontWeight として渡す」が型で通ってしまう。
 */
export type TypographyFieldEdit =
  | Readonly<{ field: "fontSize"; value: FontSize }>
  | Readonly<{ field: "lineHeight"; value: LineHeight }>
  | Readonly<{ field: "fontWeight"; value: FontWeight }>
  | Readonly<{ field: "fontFamily"; value: Option<string> }>;

/** 数値で受け取る書体のフィールド。`fontFamily` だけは文字列なので外れる。 */
export type TypographyNumberField = Exclude<TypographyField, "fontFamily">;

export const TypographyFieldEdit = {
  /**
   * 数値のフィールドの書き換えを作る。
   *
   * フィールドごとの値域の対応をここが持つのは、それがドメインの知識だから。
   * 入力欄側が `FontWeight.create` を直に呼ぶ形にすると、対応表が feature へ漏れる。
   *
   * @param field 書き換えるフィールド
   * @param value 入力欄から数値として読めた値
   * @returns そのフィールドの値域を満たすときだけ some
   */
  createNumeric(
    field: TypographyNumberField,
    value: number,
  ): Option<TypographyFieldEdit> {
    switch (field) {
      case "fontSize":
        return Option.map(FontSize.create(value), (fontSize) => ({
          field,
          value: fontSize,
        }));
      case "lineHeight":
        return Option.map(LineHeight.create(value), (lineHeight) => ({
          field,
          value: lineHeight,
        }));
      case "fontWeight":
        return Option.map(FontWeight.create(value), (fontWeight) => ({
          field,
          value: fontWeight,
        }));
    }
  },
} as const;

/**
 * フィールドと、展開先の CSS プロパティ名の対応。
 * `satisfies` により、フィールドを増やしたらこの対応表の漏れがコンパイルエラーになる。
 */
const CssProperties = {
  fontSize: "font-size",
  lineHeight: "line-height",
  fontWeight: "font-weight",
  fontFamily: "font-family",
} as const satisfies Readonly<Record<TypographyField, string>>;

/** 書体のフィールドが展開される CSS プロパティ名。 */
export type TypographyCssProperty = (typeof CssProperties)[TypographyField];

/** フィールドと CSS プロパティ名の対応。 */
export const TypographyField = {
  /**
   * 展開先の CSS プロパティ名。トークンの値には依存しないため、
   * 参照だけを組み立てる用途(`var()` 参照の生成)ではトークンを持たずに引ける。
   */
  cssProperty(field: TypographyField): TypographyCssProperty {
    return CssProperties[field];
  },
} as const;

/**
 * 不在のフォントファミリはキーごと落とす。
 * 既定値(システムフォントスタック)を書き込むと、指定していない値が
 * ファイルに残る(docs/04-tokens.md「省略時はシステムフォントスタック」)。
 *
 * @param token 書き換える元の書体トークン
 * @param fontFamily 設定するフォントファミリ。`none` ならキーごと落とす
 * @returns フォントファミリだけが入れ替わった書体トークン
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

/** 書体の値の読み書き・CSS 宣言への展開と、JSON 表現との相互変換。 */
export const TypographyToken = {
  fields(): readonly TypographyField[] {
    return Object.values(TypographyFields);
  },

  /** フォントファミリ省略時はシステムフォントスタックを既定値とする(docs/04-tokens.md)。 */
  fontFamilyOf(token: TypographyToken): string {
    return token.fontFamily ?? Font.systemStack();
  },

  /**
   * 1フィールドだけ差し替えた書体を返す。
   *
   * 値域の検査はここには無い。数値の3フィールドの値が `FontSize` / `LineHeight` /
   * `FontWeight` なので、範囲外の書き換えはそもそも組み立てられない。
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
        Object.values(TypographyFields),
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

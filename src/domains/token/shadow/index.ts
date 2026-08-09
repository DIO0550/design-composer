import { Px } from "@/domains/px";
import {
  Json,
  type JsonCursor,
  type JsonDecoded,
  type JsonObject,
} from "@/utils/Json";
import { Result } from "@/utils/Result";
import { ColorToken } from "../color";

/** 影のトークン（docs/04-tokens.md「shadows」）。`spread` だけ省略できる。 */
export type ShadowToken = Readonly<{
  x: number;
  y: number;
  blur: number;
  spread?: number;
  color: ColorToken;
}>;

/**
 * 影が持つフィールド(docs/04-tokens.md「shadows」)。
 * `ShadowField` はここから導出し、フィールドを二重管理しない。
 * `satisfies` で ShadowToken に無いフィールドが混ざらないことを、
 * 網羅は `__tests__/shadow.type.test.ts` の型テストで担保する。
 */
const SHADOW_TOKEN_FIELDS = [
  "x",
  "y",
  "blur",
  "spread",
  "color",
] as const satisfies readonly (keyof Required<ShadowToken>)[];

/** 影が持つフィールドの名前。 */
export type ShadowField = (typeof SHADOW_TOKEN_FIELDS)[number];

/**
 * 影の1フィールドの書き換え。
 * フィールドごとに値の型が違うので直和にして、「x に hex」「color に数値」を
 * 型で表現できなくする。
 */
export type ShadowFieldEdit =
  | Readonly<{ field: "x" | "y" | "blur" | "spread"; value: number }>
  | Readonly<{ field: "color"; value: ColorToken }>;

/** `box-shadow` に渡せる値。`x y blur spread color` の順に並ぶ。 */
export type BoxShadowValue = `${Px} ${Px} ${Px} ${Px} ${string}`;

/** 影の値の読み書き・`box-shadow` への展開と、JSON 表現との相互変換。 */
export const ShadowToken = {
  fields(): readonly ShadowField[] {
    return SHADOW_TOKEN_FIELDS;
  },

  /** 省略された spread は 0 とみなす(docs/04-tokens.md)。 */
  spreadOf(shadow: ShadowToken): number {
    return shadow.spread ?? 0;
  },

  /**
   * 値を正規形へ倒す。影が正規形を持つのは中の生 hex だけ
   * (docs/04-tokens.md「shadows」の `color`)。
   *
   * `spread` の 0 は省略へ倒さない。docs が定めているのは「省略時 0」という
   * 既定値の解決規則で、「0 を省略で書く」という表記の規則ではない。倒しても
   * `cssValue` も一覧の表示も変わらず、書き出しからキーが1つ消えるだけなので、
   * 仕様が求めていない書き換えになる(colors の正規化は「同値異表記の併存を
   * 防ぐ」と docs が明文で決めているので事情が違う)。
   *
   * 保存形式の規則なので、書き込みの境界(`Token.normalized`)からだけ通す。
   */
  normalized(shadow: ShadowToken): ShadowToken {
    return { ...shadow, color: ColorToken.normalize(shadow.color) };
  },

  /**
   * 1フィールドだけ差し替えた影を返す。
   *
   * 正規化はここでは通さない。保存形式の規則は書き込みの境界が持つ
   * (`Token.normalized`)ので、ここで通すと同じ正規化が経路上で二重に走る。
   *
   * 値域(blur は CSS 上マイナス不可、x / y / spread は可)も縛っていない。
   * 不正な値をどう見せるかが UI 案にも #126 にも無く、表示の形と対でしか
   * 決められないため(縛るのは #143)。
   */
  withField(shadow: ShadowToken, edit: ShadowFieldEdit): ShadowToken {
    switch (edit.field) {
      case "x":
        return { ...shadow, x: edit.value };
      case "y":
        return { ...shadow, y: edit.value };
      case "blur":
        return { ...shadow, blur: edit.value };
      case "spread":
        return { ...shadow, spread: edit.value };
      case "color":
        return { ...shadow, color: edit.value };
    }
  },

  cssValue(shadow: ShadowToken): BoxShadowValue {
    return `${Px.create(shadow.x)} ${Px.create(shadow.y)} ${Px.create(shadow.blur)} ${Px.create(
      ShadowToken.spreadOf(shadow),
    )} ${shadow.color}`;
  },

  fromJson(cursor: JsonCursor): JsonDecoded<ShadowToken> {
    return Result.flatMap(Json.record(cursor), (record) =>
      Json.knownFields(
        Json.combine5(
          Json.required(record, "x", Json.number),
          Json.required(record, "y", Json.number),
          Json.required(record, "blur", Json.number),
          Json.optional(record, "spread", Json.number),
          Json.required(record, "color", ColorToken.fromJson),
          /*
           * 読み込みでは書かれている表現をそのまま保つ（`"spread": 0` を
           * 省略へ倒さない）。倒すと、開いて別のトークンを直しただけで
           * 触っていない影の書き出しが変わる。色は `ColorToken.fromJson` が
           * 読んだ時点で小文字へ倒している。
           */
          (x, y, blur, spread, color) => ({
            x,
            y,
            blur,
            ...(spread !== undefined ? { spread } : {}),
            color,
          }),
        ),
        record,
        SHADOW_TOKEN_FIELDS,
      ),
    );
  },

  /** 省略された spread は書き戻さない(既定値の書き出しを避ける)。 */
  toJson(shadow: ShadowToken): JsonObject {
    return {
      x: shadow.x,
      y: shadow.y,
      blur: shadow.blur,
      ...Json.definedField("spread", shadow.spread),
      color: ColorToken.toJson(shadow.color),
    };
  },
} as const;

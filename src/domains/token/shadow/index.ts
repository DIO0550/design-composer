import { Px } from "@/domains/px";
import {
  Json,
  type JsonCursor,
  type JsonDecoded,
  type JsonObject,
} from "@/utils/Json";
import { Result } from "@/utils/Result";
import { ColorToken } from "../color";

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

export const ShadowToken = {
  fields(): readonly ShadowField[] {
    return SHADOW_TOKEN_FIELDS;
  },

  /** 省略された spread は 0 とみなす(docs/04-tokens.md)。 */
  spreadOf(shadow: ShadowToken): number {
    return shadow.spread ?? 0;
  },

  /**
   * 値を正規形へ倒す。色は小文字の hex、0 の spread は省略にする。
   *
   * spread を倒すのは、docs/04-tokens.md が「省略時 0」と定めていて 0 と省略が
   * 同義だから。片方の経路だけで倒すと同値異表記が併存し、書き出しが
   * 「どう編集したか」に依存する(colors が「正規形を1つに保つ」として
   * 避けているのと同じ状態)。読み込みと書き換えの両方をここへ通す。
   */
  normalized(shadow: ShadowToken): ShadowToken {
    const spread = ShadowToken.spreadOf(shadow);
    return {
      x: shadow.x,
      y: shadow.y,
      blur: shadow.blur,
      ...(spread === 0 ? {} : { spread }),
      color: ColorToken.normalize(shadow.color),
    };
  },

  /**
   * 1フィールドだけ差し替えた影を返す。
   *
   * 値域(blur は CSS 上マイナス不可、x / y / spread は可)はここで縛っていない。
   * 不正な値をどう見せるかが UI 案にも #126 にも無く、表示の形と対でしか
   * 決められないため(縛るのは別 issue)。
   */
  withField(shadow: ShadowToken, edit: ShadowFieldEdit): ShadowToken {
    switch (edit.field) {
      case "x":
        return ShadowToken.normalized({ ...shadow, x: edit.value });
      case "y":
        return ShadowToken.normalized({ ...shadow, y: edit.value });
      case "blur":
        return ShadowToken.normalized({ ...shadow, blur: edit.value });
      case "spread":
        return ShadowToken.normalized({ ...shadow, spread: edit.value });
      case "color":
        return ShadowToken.normalized({ ...shadow, color: edit.value });
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
          (x, y, blur, spread, color) =>
            ShadowToken.normalized({
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

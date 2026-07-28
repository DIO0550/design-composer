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

/** 影が JSON 上で持ちうるフィールド(docs/04-tokens.md「shadows」)。 */
const SHADOW_TOKEN_FIELDS = ["x", "y", "blur", "spread", "color"] as const;

/** `box-shadow` に渡せる値。`x y blur spread color` の順に並ぶ。 */
export type BoxShadowValue = `${Px} ${Px} ${Px} ${Px} ${string}`;

export const ShadowToken = {
  /** 省略された spread は 0 とみなす(docs/04-tokens.md)。 */
  spreadOf(shadow: ShadowToken): number {
    return shadow.spread ?? 0;
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

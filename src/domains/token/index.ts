import {
  Json,
  type JsonCursor,
  type JsonDecoded,
  type JsonObject,
} from "@/utils/Json";
import { Result } from "@/utils/Result";
import { ColorToken } from "./color";
import { ShadowToken } from "./shadow";
import { TypographyToken } from "./typography";

export { ColorToken } from "./color";
export { type BoxShadowValue, ShadowToken } from "./shadow";
export {
  type TypographyCssProperty,
  TypographyField,
  TypographyFieldRef,
  TypographyToken,
} from "./typography";

export type SpacingToken = number;
export type RadiusToken = number;

export type TokenSet = Readonly<{
  colors: Readonly<Record<string, ColorToken>>;
  spacing: Readonly<Record<string, SpacingToken>>;
  radius: Readonly<Record<string, RadiusToken>>;
  shadows: Readonly<Record<string, ShadowToken>>;
  typography: Readonly<Record<string, TypographyToken>>;
}>;

/**
 * 種別の走査に使う実行時のリスト。`TokenKind` はここから導出し、種別を二重管理しない。
 * `satisfies` で TokenSet のキー以外が混ざらないことを、
 * 種別の網羅は `__tests__/token.type.test.ts` の型テストで担保する。
 */
const TOKEN_KINDS = [
  "colors",
  "spacing",
  "radius",
  "shadows",
  "typography",
] as const satisfies readonly (keyof TokenSet)[];

export type TokenKind = (typeof TOKEN_KINDS)[number];

/**
 * 種別ごとに値の書き出し方が違うので種別で分岐する。
 * 種別が増えたら、この分岐の漏れがコンパイルエラーになる。
 */
function tokenKindToJson(tokens: TokenSet, kind: TokenKind): JsonObject {
  switch (kind) {
    case "colors":
      return Json.sortedMap(tokens.colors, ColorToken.toJson);
    case "spacing":
      return Json.sortedMap(tokens.spacing, (value) => value);
    case "radius":
      return Json.sortedMap(tokens.radius, (value) => value);
    case "shadows":
      return Json.sortedMap(tokens.shadows, ShadowToken.toJson);
    case "typography":
      return Json.sortedMap(tokens.typography, TypographyToken.toJson);
  }
}

export const TokenSet = {
  empty(): TokenSet {
    return { colors: {}, spacing: {}, radius: {}, shadows: {}, typography: {} };
  },

  has(tokens: TokenSet, kind: TokenKind, name: string): boolean {
    return name in tokens[kind];
  },

  kinds(): readonly TokenKind[] {
    return TOKEN_KINDS;
  },

  names(tokens: TokenSet, kind: TokenKind): readonly string[] {
    return Object.keys(tokens[kind]);
  },

  /**
   * 種別ごとの値の形式は docs/04-tokens.md「値の形式」に従う。
   * 書かれていない種別は空として読む(トークンを1つも持たない種別は書かれないため)。
   */
  fromJson(cursor: JsonCursor): JsonDecoded<TokenSet> {
    return Result.flatMap(Json.record(cursor), (record) =>
      Json.knownFields(
        Json.combine5(
          Json.optionalMap(record, "colors", ColorToken.fromJson),
          Json.optionalMap(record, "spacing", Json.number),
          Json.optionalMap(record, "radius", Json.number),
          Json.optionalMap(record, "shadows", ShadowToken.fromJson),
          Json.optionalMap(record, "typography", TypographyToken.fromJson),
          (colors, spacing, radius, shadows, typography) => ({
            colors,
            spacing,
            radius,
            shadows,
            typography,
          }),
        ),
        record,
        TOKEN_KINDS,
      ),
    );
  },

  /** トークンを1つも持たない種別は書き出さない(空の種別を残さない)。 */
  toJson(tokens: TokenSet): JsonObject {
    return Object.fromEntries(
      TOKEN_KINDS.filter((kind) => Object.keys(tokens[kind]).length > 0).map(
        (kind) => [kind, tokenKindToJson(tokens, kind)],
      ),
    );
  },
} as const;

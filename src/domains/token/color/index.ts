import { Json, type JsonCursor, type JsonDecoded } from "@/utils/Json";
import { Result } from "@/utils/Result";

/** 色の値。`#rrggbb` または alpha 込みの `#rrggbbaa`(docs/04-tokens.md)。 */
export type ColorToken = string;

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}([0-9a-f]{2})?$/;

/** 大文字の hex も受ける版。正規化の対象かどうかの判定にだけ使う。 */
const ANY_CASE_HEX_COLOR_PATTERN = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;

export const ColorToken = {
  /**
   * 正規形は小文字の hex のみ。
   * CSS 色文字列(`rgb()` / 名前色)を許さないのは、同値異表記の併存を
   * 構造的に排除するため(docs/04-tokens.md「値の形式」)。
   */
  isValid(value: string): boolean {
    return HEX_COLOR_PATTERN.test(value);
  },

  /**
   * hex として読める値を正規形(小文字)へ倒す。
   * hex でない値は正規形が定義できないので、意味を変えずそのまま返す
   * (不正値としての報告はバリデーションの担当)。
   */
  normalize(value: string): ColorToken {
    return ANY_CASE_HEX_COLOR_PATTERN.test(value) ? value.toLowerCase() : value;
  },

  /** JSON 上の表現は hex 文字列。読み込んだ時点で正規形へ倒す。 */
  fromJson(cursor: JsonCursor): JsonDecoded<ColorToken> {
    return Result.map(Json.string(cursor), ColorToken.normalize);
  },

  toJson(color: ColorToken): string {
    return ColorToken.normalize(color);
  },
} as const;

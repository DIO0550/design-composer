import { Json, type JsonCursor, type JsonDecoded } from "@/utils/Json";
import { Result } from "@/utils/Result";

/** 色の値。`#rrggbb` または alpha 込みの `#rrggbbaa`(docs/04-tokens.md)。 */
export type ColorToken = string;

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}([0-9a-f]{2})?$/;

/** 大文字の hex も受ける版。正規化の対象かどうかの判定にだけ使う。 */
const ANY_CASE_HEX_COLOR_PATTERN = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;

/** alpha 込みの hex。alpha を持っているかの判定にだけ使う。 */
const HEX_COLOR_WITH_ALPHA_PATTERN = /^#[0-9a-f]{8}$/i;

/** alpha の2桁。持っていなければ空文字（不透明を表す桁を足さない）。 */
function alphaOf(color: ColorToken): string {
  return HEX_COLOR_WITH_ALPHA_PATTERN.test(color) ? color.slice(7) : "";
}

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

  /**
   * RGB の6桁だけを差し替え、alpha は元の値から引き継ぐ。
   *
   * `#rrggbbaa` は正規形として認められている(docs/04-tokens.md「colors」)が、
   * `input[type=color]` は6桁しか扱えず alpha を表せない。引き継がないと、
   * 半透明が常用される影の色(同「shadows」)をピッカーで触るだけで不透明になる。
   */
  withRgb(color: ColorToken, rgb: string): ColorToken {
    return ColorToken.normalize(`${rgb}${alphaOf(color)}`);
  },

  /** JSON 上の表現は hex 文字列。読み込んだ時点で正規形へ倒す。 */
  fromJson(cursor: JsonCursor): JsonDecoded<ColorToken> {
    return Result.map(Json.string(cursor), ColorToken.normalize);
  },

  toJson(color: ColorToken): string {
    return ColorToken.normalize(color);
  },
} as const;

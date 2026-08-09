import { Json, type JsonCursor, type JsonDecoded } from "@/utils/Json";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/** 色の値。`#rrggbb` または alpha 込みの `#rrggbbaa`(docs/04-tokens.md)。 */
export type ColorToken = string;

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}([0-9a-f]{2})?$/;

/** 大文字の hex も受ける版。正規化の対象かどうかの判定にだけ使う。 */
const ANY_CASE_HEX_COLOR_PATTERN = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;

/** alpha を持たない6桁だけの hex。大文字も受ける(生成時に小文字へ倒す)。 */
const ANY_CASE_RGB_PATTERN = /^#[0-9a-f]{6}$/i;

/**
 * alpha を持たない色(`#rrggbb`)。
 *
 * `ColorToken` と分けるのは、alpha を持てるかどうかで**できることが変わる**ため。
 * カラーピッカー(`input[type=color]`)が扱えるのはこの形だけで、
 * 「ピッカーから来た6桁」と「alpha を持ちうる保存済みの色」を同じ型にすると、
 * 一方を他方のつもりで渡しても型が通ってしまう。
 *
 * 生成は `create` だけに閉じる。`#` から始まる形を型に出しているので、
 * 素の `string` はそのまま代入できない(`Px` と同じ縛り方)。
 */
export type Rgb = `#${string}`;

export const Rgb = {
  /**
   * 6桁の hex として読める文字列だけを RGB にする。読めなければ `none`。
   * 「生成された = 6桁の小文字 hex である」を成立させるための唯一の入口。
   */
  create(value: string): Option<Rgb> {
    return ANY_CASE_RGB_PATTERN.test(value)
      ? // 実行時に6桁 hex であることを確かめた戻り値なので、ここだけ as を許す
        Option.some(value.toLowerCase() as Rgb)
      : Option.none;
  },
} as const;

/**
 * alpha の2桁を正規形（小文字）で返す。持っていなければ空文字
 * （不透明を表す桁を足さない）。
 * hex の綴りを別の正規表現で書き直すと、片方だけ直したときに気づけないので
 * 既存のパターンの任意キャプチャから引く。
 *
 * @param color alpha を読む対象の色
 * @returns 小文字の 2 桁。alpha を持たなければ空文字
 */
function alphaOf(color: ColorToken): string {
  return ANY_CASE_HEX_COLOR_PATTERN.exec(color)?.[1]?.toLowerCase() ?? "";
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
   * 6桁であることは `Rgb` が型で保証するので、ここでは確かめ直さない。
   *
   * `#rrggbbaa` は正規形として認められている(docs/04-tokens.md「colors」)が、
   * `input[type=color]` は6桁しか扱えず alpha を表せない。引き継がないと、
   * 半透明が常用される影の色(同「shadows」)をピッカーで触るだけで不透明になる。
   *
   * 引き継ぐ側の代償として、alpha を外す手段が画面に無い。alpha の入力欄は
   * UI 案(docs/Design Composer.html)に無いため #142 で別に決める。
   */
  withRgb(color: ColorToken, rgb: Rgb): ColorToken {
    return `${rgb}${alphaOf(color)}`;
  },

  /** JSON 上の表現は hex 文字列。読み込んだ時点で正規形へ倒す。 */
  fromJson(cursor: JsonCursor): JsonDecoded<ColorToken> {
    return Result.map(Json.string(cursor), ColorToken.normalize);
  },

  toJson(color: ColorToken): string {
    return ColorToken.normalize(color);
  },
} as const;

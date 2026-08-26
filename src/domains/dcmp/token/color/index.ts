import { Json, type JsonCursor, type JsonDecoded } from "@/utils/Json";
import { Option } from "@/utils/Option";
import { Range } from "@/utils/Range";
import { Result } from "@/utils/Result";

/** 色の値。`#rrggbb` または alpha 込みの `#rrggbbaa`(docs/04-tokens.md)。 */
export type ColorToken = string;

const HexColorPattern = /^#[0-9a-f]{6}([0-9a-f]{2})?$/;

/** 大文字の hex も受ける版。正規化の対象かどうかの判定にだけ使う。 */
const AnyCaseHexColorPattern = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;

/** alpha を持たない6桁だけの hex。大文字も受ける(生成時に小文字へ倒す)。 */
const AnyCaseRgbPattern = /^#[0-9a-f]{6}$/i;

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
    return AnyCaseRgbPattern.test(value)
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
  return AnyCaseHexColorPattern.exec(color)?.[1]?.toLowerCase() ?? "";
}

/** 不透明を表す alpha の 2 桁。 */
const OpaqueAlphaHex = "ff";

/** alpha を最大まで開いたときのバイト値。 */
const OpaqueAlphaByte = 255;

/** `#` と 6 桁を合わせた長さ。alpha の桁を落とすときの切り取り位置。 */
const RgbLength = 7;

/**
 * 不透明度の % の値域。
 * CSS の alpha と同じく 0%（完全に透明）から 100%（不透明）まで。
 */
const AlphaPercentRange: Range = { min: 0, max: 100 };

/**
 * 保存形式の 2 桁と行き来しても値が変わらない、% の刻み。
 *
 * 0.1% 刻みにすると 256 通りの alpha すべてが同じ 2 桁へ戻る。整数 % だと
 * 155 通りが別の値になり（`#rrggbb01` は 0% を経由して完全な透明になる）、
 * 往復で値が変わらないという仕様（#142）を満たせない。
 */
const PercentStepsPerUnit = 10;

export const ColorToken = {
  /**
   * 正規形は小文字の hex のみ。
   * CSS 色文字列(`rgb()` / 名前色)を許さないのは、同値異表記の併存を
   * 構造的に排除するため(docs/04-tokens.md「値の形式」)。
   */
  isValid(value: string): boolean {
    return HexColorPattern.test(value);
  },

  /**
   * hex として読める値を正規形(小文字・不透明なら6桁)へ倒す。
   * hex でない値は正規形が定義できないので、意味を変えずそのまま返す
   * (不正値としての報告はバリデーションの担当)。
   *
   * `ff` を落とすのは、`#111827` と `#111827ff` が同値異表記で、
   * docs/04-tokens.md「値の形式」が正規形を1つに保つと明文で決めているため。
   * `ShadowToken.normalized` が `spread` の 0 を省略へ倒さないのとは事情が違う
   * (あちらが定めているのは既定値の解決規則で、表記の規則ではない)。
   */
  normalize(value: string): ColorToken {
    if (!AnyCaseHexColorPattern.test(value)) {
      return value;
    }
    const lowered = value.toLowerCase();
    return alphaOf(lowered) === OpaqueAlphaHex
      ? lowered.slice(0, RgbLength)
      : lowered;
  },

  /**
   * ピッカーに載せられる 6 桁の部分。
   *
   * `input[type=color]` は6桁しか扱えず、8桁を渡すとブラウザが `#000000` へ
   * 落として黙って黒い見本を出すため、載せる前にここで分ける。
   *
   * @param color 6 桁の部分を取り出したい色
   * @returns hex として読めた場合だけ `some`。読めない値は取り出しようがないので `none`
   */
  rgbOf(color: ColorToken): Option<Rgb> {
    return AnyCaseHexColorPattern.test(color)
      ? Rgb.create(color.slice(0, RgbLength))
      : Option.none;
  },

  /**
   * その色の不透明度(%)。小数第1位まで。
   *
   * @param color 不透明度を読みたい色
   * @returns 0（完全に透明）から 100（不透明）。alpha の桁を持たない色は
   *   不透明なので 100（hex として読めない値も alpha を持たないので同じ）
   */
  alphaPercentOf(color: ColorToken): number {
    const alpha = alphaOf(color);
    const byte = alpha === "" ? OpaqueAlphaByte : Number.parseInt(alpha, 16);
    return (
      Math.round((byte / OpaqueAlphaByte) * 100 * PercentStepsPerUnit) /
      PercentStepsPerUnit
    );
  },

  /**
   * RGB の6桁だけを差し替えた色。alpha は元の値のまま残る。
   * 6桁であることは `Rgb` が型で保証するので、ここでは確かめ直さない。
   *
   * @param color 差し替える前の色
   * @param rgb 差し替え後の 6 桁
   * @returns RGB だけが入れ替わった色
   */
  withRgb(color: ColorToken, rgb: Rgb): ColorToken {
    return `${rgb}${alphaOf(color)}`;
  },

  /**
   * 不透明度だけを差し替えた色。RGB は元の値のまま残る。
   *
   * @param color 差し替える前の色
   * @param percent 差し替え後の不透明度(%)。小数も取る
   * @returns 不透明度だけが入れ替わった色。0–100 の外、および hex として
   *   読めない色（差し替える先の 6 桁が取り出せない）では `none`
   */
  withAlphaPercent(color: ColorToken, percent: number): Option<ColorToken> {
    if (!Range.contains(AlphaPercentRange, percent)) {
      return Option.none;
    }
    return Option.map(ColorToken.rgbOf(color), (rgb) => {
      const byte = Math.round((percent / 100) * OpaqueAlphaByte);
      // 不透明なら6桁へ倒すのは normalize の担当。ここで二重に持たない
      return ColorToken.normalize(
        `${rgb}${byte.toString(16).padStart(2, "0")}`,
      );
    });
  },

  /** JSON 上の表現は hex 文字列。読み込んだ時点で正規形へ倒す。 */
  fromJson(cursor: JsonCursor): JsonDecoded<ColorToken> {
    return Result.map(Json.string(cursor), ColorToken.normalize);
  },

  toJson(color: ColorToken): string {
    return ColorToken.normalize(color);
  },
} as const;

import { Option } from "@/utils/Option";

/**
 * 下端と上端を含む数値の範囲（閉区間）。
 *
 * 下端と上端は常に対でしか意味を持たないので1つの型にまとめる。位置引数で
 * `(value, min, max)` と並べると、取り違えても型エラーにならない
 * （rules/coding.md「同じ型の位置引数が2つ以上並び…」）。
 */
export type Range = Readonly<{ min: number; max: number }>;

/** 範囲の判定と計算。 */
export const Range = {
  /**
   * その範囲に入っているか。下端と上端はどちらも含む。
   *
   * 上下端が有限なら `NaN` と `±Infinity` は比較で落ちるので、
   * 有限かどうかを別に見る必要はない。
   *
   * @param range 見る範囲
   * @param value 見たい数値
   * @returns 下端以上・上端以下なら true
   */
  contains(range: Range, value: number): boolean {
    return range.min <= value && value <= range.max;
  },

  /**
   * 2 つの範囲が重なっている長さ。
   *
   * @param range 見る範囲
   * @param other 重なりを見る相手の範囲
   * @returns 重なっている部分の長さ。離れている / 端が接するだけなら 0
   */
  intersectionLength(range: Range, other: Range): number {
    return Math.max(
      0,
      Math.min(range.max, other.max) - Math.max(range.min, other.min),
    );
  },

  /**
   * 離れている 2 つの範囲の間。どちらが前にあるかは問わない。
   *
   * @param range 見る範囲
   * @param other 間を見る相手の範囲
   * @returns 前の範囲の上端から後ろの範囲の下端まで。重なっている / 端が接するだけなら `none`
   */
  gapBetween(range: Range, other: Range): Option<Range> {
    const min = Math.min(range.max, other.max);
    const max = Math.max(range.min, other.min);
    return min < max ? Option.some({ min, max }) : Option.none;
  },

  /**
   * 範囲の長さ。
   *
   * @param range 見る範囲
   * @returns 上端から下端を引いた長さ
   */
  length(range: Range): number {
    return range.max - range.min;
  },

  /**
   * 範囲の中央。
   *
   * @param range 見る範囲
   * @returns 下端と上端の真ん中の値
   */
  center(range: Range): number {
    return (range.min + range.max) / 2;
  },
} as const;

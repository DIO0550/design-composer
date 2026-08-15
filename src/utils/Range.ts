/**
 * 下端と上端を含む数値の範囲（閉区間）。
 *
 * 下端と上端は常に対でしか意味を持たないので1つの型にまとめる。位置引数で
 * `(value, min, max)` と並べると、取り違えても型エラーにならない
 * （rules/coding.md「同じ型の位置引数が2つ以上並び…」）。
 */
export type Range = Readonly<{ min: number; max: number }>;

/** 範囲の判定。 */
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
} as const;

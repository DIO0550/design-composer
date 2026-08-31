/** 数値の性質を答える汎用操作。 */
export const NumberEx = {
  isNatural(value: number): boolean {
    return Number.isInteger(value) && value >= 0;
  },

  /**
   * 有限で 0 より大きいか。
   *
   * 有限であることを名前に出しているのは、`Infinity` が数学的には正の数だから。
   * `isPositive` にすると、`Infinity` が外れる理由が呼び出し側から読めない。
   *
   * @param value 見たい数値
   * @returns 有限かつ 0 より大きいなら true。`NaN` と `±Infinity` は false
   */
  isFinitePositive(value: number): boolean {
    return Number.isFinite(value) && value > 0;
  },

  /**
   * 有限で 0 以上か。
   *
   * @param value 見たい数値
   * @returns 有限かつ 0 以上なら true。`NaN` と `±Infinity` は false
   */
  isFiniteNonNegative(value: number): boolean {
    return Number.isFinite(value) && value >= 0;
  },

  /**
   * 範囲の内側へ収めた値。
   *
   * 上下を1つずつ受けず範囲を1つの引数にしているのは、`min` と `max` を取り違えても
   * 型では落ちないため（どちらも `number`）。
   *
   * @param value 収める値
   * @param range 収める先の下限と上限
   * @returns `min` 以上 `max` 以下に収まった値。下限が上限を上回る範囲では上限が勝つ
   */
  clamp(value: number, range: Readonly<{ min: number; max: number }>): number {
    return Math.min(range.max, Math.max(range.min, value));
  },
} as const;

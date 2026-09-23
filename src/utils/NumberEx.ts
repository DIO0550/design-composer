/** 数値の性質の判定と、範囲・桁への丸め。 */
export const NumberEx = {
  /**
   * 0 以上の整数か。
   *
   * @param value 見たい数値
   * @returns 0 を含む 0 以上の整数なら true。負数・小数・`NaN`・`±Infinity` は false
   */
  isNatural(value: number): boolean {
    return Number.isInteger(value) && value >= 0;
  },

  /**
   * 有限で 0 より大きいか。
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

  /**
   * 小数点以下を指定の桁数で四捨五入した値。
   *
   * 桁数をオブジェクトで受けるのは、値と桁数を取り違えても型では落ちないため（どちらも
   * `number`）。
   *
   * @param value 丸める値
   * @param digits 小数点以下に残す桁数
   * @returns 小数点以下 `fractionDigits` 桁に四捨五入した値
   */
  round(value: number, digits: Readonly<{ fractionDigits: number }>): number {
    const scale = 10 ** digits.fractionDigits;
    return Math.round(value * scale) / scale;
  },
} as const;

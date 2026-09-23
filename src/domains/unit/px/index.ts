/**
 * px 単位付きの長さ。
 * 単位なしの number や別単位の文字列を長さとして扱う誤りを型で防ぐ。
 */
export type Px = `${number}px`;

export const Px = {
  /**
   * 数値に px を付けて長さにする。
   *
   * @param value px 単位の長さ。検証しないので `NaN` / `Infinity` / 負の数もそのまま綴る
   *   （`"NaNpx"` / `"-3px"`）
   * @returns `value` の数値表記の後ろに `px` を付けた長さ
   */
  create(value: number): Px {
    return `${value}px`;
  },
} as const;

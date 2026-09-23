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
   *   （`"NaNpx"` / `"Infinitypx"` / `"-3px"`）。`-0` は `"0px"`、絶対値が `1e21` 以上か
   *   0 より大きく `1e-7` 未満の数は指数表記（`"1e+21px"` / `"1e-7px"`）になる
   * @returns `value` の数値表記の後ろに `px` を付けた長さ
   */
  create(value: number): Px {
    return `${value}px`;
  },
} as const;

/**
 * px 単位付きの長さ。
 * 単位なしの number をそのまま CSS の値として使う誤りを型で防ぐ。
 */
export type Px = `${number}px`;

export const Css = {
  px(value: number): Px {
    return `${value}px`;
  },
} as const;

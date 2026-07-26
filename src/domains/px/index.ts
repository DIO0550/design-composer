/**
 * px 単位付きの長さ。
 * 単位なしの number や別単位の文字列を長さとして扱う誤りを型で防ぐ。
 */
export type Px = `${number}px`;

export const Px = {
  create(value: number): Px {
    return `${value}px`;
  },
} as const;

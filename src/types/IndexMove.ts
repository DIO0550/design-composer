/**
 * 並びの中で 1 つを別の位置へ移すこと。
 *
 * 今の位置と移す先は片方だけでは移動が決まらないため 1 つの型にまとめる（同じ型の数が 2 つ
 * 並ぶので、位置引数だと取り違えても型エラーにならない）。
 *
 * 並べ替え（`ReorderDrag`）が今の唯一の使い手だが、中身は「index から index へ」でしかない
 * ので用途では名付けない。
 */
export type IndexMove = Readonly<{ fromIndex: number; toIndex: number }>;

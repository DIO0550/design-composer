/**
 * 並びの中で 1 つを別の位置へ移すこと。
 *
 * 今の位置と移す先は片方だけでは移動が決まらないため 1 つの型にまとめる（同じ型の数が 2
 * つ並ぶので、位置引数だと取り違えても型エラーにならない）。
 *
 * 並べ替え（`ReorderDrag`）が今の唯一の使い手だが、中身は「index から index へ」でしか
 * ないので用途では名付けない。
 *
 * `types/` に置くのはロジックを持たない純粋な型だから。どの層からも import できるので、
 * 横断層と feature の両方から同じ 1 つを指せる。
 */
export type IndexMove = Readonly<{ fromIndex: number; toIndex: number }>;

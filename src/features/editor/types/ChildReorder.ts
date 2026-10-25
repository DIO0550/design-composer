import type { ChildPosition } from "@/domains/dcmp/child-position";

/**
 * 兄弟をまとめて並べ替えるときの、子 1 つぶんの動かし方（`ReorderStep.toChildReorders` が
 * 当てる順に並べて返すもの）。
 *
 * 並べて返すには 1 件ごとに位置と行き先が対で要るため 1 つの型にまとめる。
 */
export type ChildReorder = Readonly<{
  /** 動かす子の親と、動かす前の位置。 */
  from: ChildPosition;
  /** 動かしたあとにその子が来る位置。 */
  toIndex: number;
}>;

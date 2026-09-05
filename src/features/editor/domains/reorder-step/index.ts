import type { ChildPosition } from "@/domains/dcmp/child-position";
import type { ValueOf } from "@/types/ValueOf";

/**
 * 兄弟の並びの中で 1 つぶん動かす向き（docs/06-ui.md「編集操作の一覧」の並べ替え）。
 *
 * 「どこへ動かすか」ではなく「どちらへ 1 つか」で持つのは、キーボードからの操作が
 * 今の位置を知らないため（ツリーのドラッグは掴んだ位置を持っているので `IndexMove`
 * で足りる）。
 */
export const ReorderSteps = {
  TowardFront: "toward-front",
  TowardBack: "toward-back",
} as const;

/** 並べ替えの向き。 */
export type ReorderStep = ValueOf<typeof ReorderSteps>;

export const ReorderStep = {
  /**
   * この 1 歩ぶん動かした先の、兄弟の並びの中での index。
   *
   * 前面へが `+1` なのは、並びの末尾が最前面だから（docs/06-ui.md「キャンバス直接操作」）。
   * 規則そのものは並び側の約束だが、`ChildPosition` は `dcmp`（ファイルに書かれる中身）で
   * 編集操作の語彙を知れないため、向きを持つこちら側が持つ。
   *
   * 並びの外へ出る index も返す。動かせるかどうかは並びの長さを知っている側
   * （`DesignDocument.reorderNode`）が失敗として答える。
   *
   * @param step 動かす向き
   * @param from 今いる位置
   * @returns 動かした先の index
   */
  toIndex(step: ReorderStep, from: ChildPosition): number {
    switch (step) {
      case "toward-front":
        return from.index + 1;
      case "toward-back":
        return from.index - 1;
    }
  },
} as const;

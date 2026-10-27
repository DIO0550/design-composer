import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import type { ThinLine } from "@/features/editor/features/canvas/domains/thin-line";
import { Option } from "@/utils/Option";
import { Range } from "@/utils/Range";

/**
 * 2 つの矩形の間に引く短い線と、その中点に出す長さ。揃え先との隙間と Alt / Option の距離の
 * どちらにも使う。
 *
 * 単位が 1 つだけ違う: `line` は描く線なので**画面上の px**、`length` は人に見せる値なので
 * **ドキュメント上の px**（最も近い整数・1 以上）。
 */
export type DistanceReadout = Readonly<{
  line: ThinLine;
  length: number;
}>;

export const DistanceReadout = {
  /**
   * 短い線に、見せる長さを添える。
   *
   * @param line 2 つの矩形の間に引く短い線（画面上の px）
   * @param view 割り戻しに使う倍率を持つ表示
   * @returns 線と、線が伸びる範囲の長さをドキュメント上の px へ丸めた値。丸めて 0 になる
   *   なら `none`
   */
  create(line: ThinLine, view: CanvasView): Option<DistanceReadout> {
    const length = CanvasView.toRoundedDocumentLength(
      view,
      Range.length(line.span),
    );
    return length > 0 ? Option.some({ line, length }) : Option.none;
  },
} as const;

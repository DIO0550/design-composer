import { Offset } from "@/domains/unit/offset";
import { CanvasBounds } from "@/features/canvas/domains/canvas-bounds";
import { DragThresholdPx } from "@/features/canvas/domains/node-drag";

/**
 * 空き領域から引いている選択の範囲（docs/06-ui.md「範囲選択」）。掴んだ点と今の点の対を、
 * 画面上の client 座標で持つ（実測 `DrawnBounds` と揃える）。
 *
 * ここが指すのは画面上の 2 次元の範囲。
 */
export type RangeSelect = Readonly<{
  from: Offset;
  to: Offset;
  /**
   * 一度でも閾値を超えたか（手ぶれと区別する / `extendedTo`）。
   *
   * 引いている間は逐次選び直すので、縮めた結果の「何も入らない」も選択へ反映しないと、広げた
   * ときの選択が残る。
   */
  isDrawn: boolean;
}>;

export const RangeSelect = {
  /**
   * 押した位置から始まる、まだ広がっていない範囲。
   *
   * @param from 押した位置（client 座標）
   * @returns 面積を持たず、まだ引かれていない範囲
   */
  create(from: Offset): RangeSelect {
    return { from, to: from, isDrawn: false };
  },

  /**
   * 引いている先を今の位置へ伸ばした範囲。掴んだ点は動かない。
   *
   * 掴んだ点から閾値ぶん離れた時点で「引かれた」に変わる。閾値を置かないと、
   * 空き領域を**クリックしただけ**で 0 面積の範囲が成立し、何も入らないので選択が
   * 外れる。クリックで選択が外れるのは docs/06-ui.md「キャンバスのクリックが選ぶ階層」
   * （外れるのは Esc など）と食い違う。閾値はノードと artboard のドラッグが使って
   * いるものと同じ（`DragThresholdPx`）。
   *
   * @param range 伸ばす範囲
   * @param to 今のポインタの位置（client 座標）
   * @returns 掴んだ点はそのままに、反対の角が今の位置へ来た範囲
   */
  extendedTo(range: RangeSelect, to: Offset): RangeSelect {
    const reachesThreshold = Offset.distance(range.from, to) >= DragThresholdPx;
    return {
      from: range.from,
      to,
      isDrawn: range.isDrawn || reachesThreshold,
    };
  },

  /**
   * その範囲が画面上で占める矩形。
   *
   * @param range 矩形にする範囲
   * @returns 2 点を対角にした矩形
   */
  bounds(range: RangeSelect): CanvasBounds {
    return CanvasBounds.spanning(range.from, range.to);
  },
} as const;

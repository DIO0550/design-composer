import { CanvasBounds } from "@/features/canvas/domains/node-drop";
import { CanvasDom } from "@/libs/canvas-dom";
import { Option } from "@/utils/Option";

/**
 * キャンバスに描かれているものの実測。
 * ハンドルを重ねる位置（`use-drawn-bounds`）とリサイズの当たり判定（`use-node-resize`）が
 * 同じ測り方をするため 1 箇所に集める（`CanvasPointer` と同じ形）。
 */
export const DrawnBounds = {
  /**
   * 名前で指した要素が今どこにどれだけの大きさで描かれているか（client 座標）。
   *
   * @param name 描かれている artboard / ノードの名前
   * @returns 描かれている矩形。その名前の要素がまだ画面に出ていなければ `none`
   */
  measure(name: string): Option<CanvasBounds> {
    return Option.map(CanvasDom.elementOf(name), CanvasBounds.ofElement);
  },
} as const;

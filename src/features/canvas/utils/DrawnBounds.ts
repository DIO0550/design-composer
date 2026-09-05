import { CanvasBounds } from "@/features/canvas/domains/node-drop";
import { CanvasDom } from "@/libs/canvas-dom";
import { Option } from "@/utils/Option";

/**
 * キャンバスに描かれているものの実測。
 * ハンドルを重ねる位置（`use-drawn-bounds`）とリサイズの当たり判定（`use-node-resize`）が
 * 同じ測り方をするため 1 箇所に集める（`CanvasPointer` と同じ形）。
 *
 * Why not: `CanvasBounds` のメソッドにしない。名前から要素を引くのは `libs/` が持つ I/O で、
 * ドメインへ持ち込むと `CanvasBounds` 自身が DOM に依存する（`ofElement` は要素を受け取るだけ）。
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

  /**
   * 名前で指したものすべてを含む矩形（client 座標）。
   *
   * 描かれていない名前は**飛ばして残りで囲む**。全部揃うまで何もしない形にすると、
   * 名前が 1 つでも引けないときに操作そのものが起きなくなる。
   *
   * @param names 囲みたい artboard / ノードの名前
   * @returns 描かれているものを含む最小の矩形。名前が空、または 1 つも描かれて
   *   いなければ `none`
   */
  enclosing(names: readonly string[]): Option<CanvasBounds> {
    const drawn = names.flatMap((name) => {
      const measured = DrawnBounds.measure(name);
      return measured.some ? [measured.value] : [];
    });
    return CanvasBounds.enclosing(drawn);
  },
} as const;

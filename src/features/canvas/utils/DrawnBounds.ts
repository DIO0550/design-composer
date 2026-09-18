import { CanvasBounds } from "@/features/canvas/domains/canvas-bounds";
import { CanvasDom } from "@/libs/canvas-dom";
import { Option } from "@/utils/Option";

/**
 * キャンバスに描かれているものの実測を 1 箇所に集める（`CanvasPointer` と同じ形）。
 */
export const DrawnBounds = {
  /**
   * 名前で指した要素が今どこにどれだけの大きさで描かれているか（client 座標）。
   *
   * ハンドルを重ねる位置（`use-drawn-bounds`）・リサイズの当たり判定（`use-node-resize`）・
   * 文言のその場編集で入力欄を重ねる位置（`use-text-edit`）・座標の置き直しで寄せの原点に
   * する今の親と、運んでいるものの大きさ（`use-node-drag`）が同じ測り方をする。
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
      return Option.isSome(measured) ? [measured.value] : [];
    });
    return CanvasBounds.enclosing(drawn);
  },

  /**
   * 名前で指したもののうち、その矩形に重なって描かれているもの（範囲選択が拾う相手）。
   *
   * 面積を持たないものは外す。要素が在っても**まだレイアウトされていない / 畳まれている**
   * ときの実測は原点の 0×0 で返るため、外さないと画面の左上へ引いた範囲がそれらを
   * まとめて拾う（`CanvasBounds.hasArea` の doc）。
   *
   * @param names 見る artboard / ノードの名前
   * @param bounds 重なりを見る矩形（client 座標）
   * @returns 重なって描かれているものの名前。渡された並びの順を保つ
   */
  collectOverlappingNames(
    names: readonly string[],
    bounds: CanvasBounds,
  ): readonly string[] {
    return names.filter((name) => {
      const measured = DrawnBounds.measure(name);
      return (
        Option.isSome(measured) &&
        CanvasBounds.hasArea(measured.value) &&
        CanvasBounds.overlaps(measured.value, bounds)
      );
    });
  },
} as const;

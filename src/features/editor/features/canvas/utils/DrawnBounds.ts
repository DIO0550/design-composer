import { Rotation } from "@/domains/dcmp/rotation";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { RotatedBounds } from "@/features/editor/features/canvas/domains/rotated-bounds";
import { CanvasDom } from "@/libs/canvas-dom";
import { Option } from "@/utils/Option";

/**
 * 名前で指した、キャンバスに描かれているものの実測をまとめる（`CanvasPointer` と同じ形）。
 */
export const DrawnBounds = {
  /**
   * 名前で指した要素が今どこにどれだけの大きさで描かれているか（client 座標）。
   *
   * @param name 描かれている artboard / ノードの名前
   * @returns 描かれている矩形。その名前の要素がまだ画面に出ていなければ `none`
   */
  measure(name: string): Option<CanvasBounds> {
    return Option.map(CanvasDom.elementOf(name), CanvasDom.boundsOf);
  },

  /**
   * 名前で指した要素が、今どこにどれだけの大きさでどの向きに回って描かれているか
   * （client 座標）。
   *
   * 回っていなければ外接矩形をそのまま使う。レイアウトの大きさは整数へ丸められている
   * ので、使うと `fill` などで端数を持つ要素の矩形が今の実測からずれる。
   *
   * @param name 描かれている artboard / ノードの名前
   * @param rotation その名前のものの画面上の向き（自分と祖先の合計）
   * @param view レイアウトの大きさを画面上の大きさへ直す倍率
   * @returns 回る前の矩形と向き。その名前の要素がまだ画面に出ていない・回っているのに
   *   レイアウトの大きさを測れないときは `none`
   */
  measureRotated(
    name: string,
    rotation: Rotation,
    view: CanvasView,
  ): Option<RotatedBounds> {
    return Option.flatMap(CanvasDom.elementOf(name), (element) => {
      const enclosing = CanvasDom.boundsOf(element);
      if (Rotation.isWholeTurns(rotation)) {
        return Option.some(
          RotatedBounds.fromEnclosing(enclosing, enclosing, rotation),
        );
      }
      return Option.map(CanvasDom.layoutSizeOf(element), (size) => {
        const drawn = CanvasView.toScreenOffset(view, {
          x: size.width,
          y: size.height,
        });
        return RotatedBounds.fromEnclosing(
          enclosing,
          { width: drawn.x, height: drawn.y },
          rotation,
        );
      });
    });
  },

  /**
   * 名前で指したもののうち、大きさを持って描かれているものの矩形（client 座標）。
   *
   * @param names 測りたい artboard / ノードの名前
   * @returns 描かれていて面積を持つものの矩形。渡された並びの順を保つ
   */
  collectDrawnBounds(names: readonly string[]): readonly CanvasBounds[] {
    return names.flatMap((name) => {
      const measured = measureWithArea(name);
      return Option.isSome(measured) ? [measured.value] : [];
    });
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
   * 面積を持たないものは外す（`measureWithArea`）。外さないと画面の左上へ引いた範囲が
   * それらをまとめて拾う。
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
      const measured = measureWithArea(name);
      return (
        Option.isSome(measured) && CanvasBounds.overlaps(measured.value, bounds)
      );
    });
  },
} as const;

/**
 * 名前で指した要素の矩形のうち、面積を持つもの。
 *
 * 要素が在っても**まだレイアウトされていない / 畳まれている**ときの実測は原点の 0×0 で
 * 返る（`CanvasBounds.hasArea` の doc）。そこに何かがあるとみなすと、原点のまわりへの
 * 操作がそれらを拾ってしまう。
 *
 * @param name 描かれている artboard / ノードの名前
 * @returns 描かれている矩形。描かれていない / 面積を持たないなら `none`
 */
function measureWithArea(name: string): Option<CanvasBounds> {
  return Option.flatMap(DrawnBounds.measure(name), (bounds) =>
    CanvasBounds.hasArea(bounds) ? Option.some(bounds) : Option.none,
  );
}

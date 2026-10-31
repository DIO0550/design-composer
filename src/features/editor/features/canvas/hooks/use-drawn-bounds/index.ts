import type { RefObject } from "react";
import type { Angle } from "@/domains/unit/angle";
import type { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { RotatedBounds } from "@/features/editor/features/canvas/domains/rotated-bounds";
import { useMeasured } from "@/features/editor/features/canvas/hooks/use-measured";
import { DrawnBounds } from "@/features/editor/features/canvas/utils/DrawnBounds";
import { CanvasDom } from "@/libs/canvas-dom";
import { Option } from "@/utils/Option";

/** 測るものの画面上の向きと、レイアウトの大きさを画面上へ直す倍率。 */
type MeasureBasis = Readonly<{ rotation: Angle; view: CanvasView }>;

/**
 * 器からの相対に置き直した、名前で指した要素の回って描かれている矩形。
 *
 * @param target 測りたい要素の名前。未選択なら `none`
 * @param container 座標の原点にする器
 * @param basis 測るものの向きと倍率
 * @returns 器の左上を原点にした矩形と向き。名前が無い / 要素が出ていない / 回っているのに
 *   レイアウトの大きさを測れない / 器がまだマウントされていなければ `none`
 */
function measure(
  target: Option<string>,
  container: HTMLElement | null,
  basis: MeasureBasis,
): Option<RotatedBounds> {
  if (container === null) {
    return Option.none;
  }
  const origin = CanvasDom.boundsOf(container);
  return Option.map(
    Option.flatMap(target, (name) =>
      DrawnBounds.measureRotated(name, basis.rotation, basis.view),
    ),
    (bounds) => RotatedBounds.relativeTo(bounds, origin),
  );
}

/**
 * 回って描かれている矩形を、変わるたびに追いかけて返す（リサイズハンドルを回った辺に
 * 重ねるために使う）。
 *
 * 測り直し方（毎コミット測り直し、ウィンドウの大きさの変化を購読し、同じなら前の参照を
 * 返す）は `useMeasured`。
 *
 * @param target 追いかける artboard / ノードの名前。未選択なら `none`
 * @param container 座標の原点にする器（ハンドルを重ねる側の要素）
 * @param basis 追いかけるものの画面上の向き（自分と祖先の合計）と、倍率
 * @returns 器からの相対で表した矩形と向き。測れなければ `none`
 */
export function useDrawnBounds(
  target: Option<string>,
  container: RefObject<HTMLElement | null>,
  basis: MeasureBasis,
): Option<RotatedBounds> {
  return useMeasured(
    () => measure(target, container.current, basis),
    RotatedBounds.equals,
  );
}

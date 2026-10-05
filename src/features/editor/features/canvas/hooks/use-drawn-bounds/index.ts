import { type RefObject, useLayoutEffect, useState } from "react";
import type { Rotation } from "@/domains/dcmp/rotation";
import type { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { RotatedBounds } from "@/features/editor/features/canvas/domains/rotated-bounds";
import { DrawnBounds } from "@/features/editor/features/canvas/utils/DrawnBounds";
import { CanvasDom } from "@/libs/canvas-dom";
import { Option } from "@/utils/Option";

/** 測るものの画面上の向きと、レイアウトの大きさを画面上へ直す倍率。 */
type MeasureBasis = Readonly<{ rotation: Rotation; view: CanvasView }>;

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
 * 2 つの結果が同じものを指しているか。
 *
 * @param previous 前に持っていた結果
 * @param next 測り直した結果
 * @returns どちらも不在か、同じ矩形・同じ向きを指していれば `true`
 */
function isSame(
  previous: Option<RotatedBounds>,
  next: Option<RotatedBounds>,
): boolean {
  if (!Option.isSome(previous) || !Option.isSome(next)) {
    return Option.isSome(previous) === Option.isSome(next);
  }
  return RotatedBounds.equals(previous.value, next.value);
}

/**
 * 回って描かれている矩形を、変わるたびに追いかけて返す（リサイズハンドルを回った辺に
 * 重ねるために使う）。
 *
 * **依存配列を持たず毎コミット測り直す。** 位置が動く原因はキャンバス自身のドキュメント
 * / 倍率だけでなく、トークン選択やエラー一覧の出入りで中央ペインの高さが変わることでも
 * 起きるため、原因を列挙して deps に並べると上流の状態が増えるたびに追随が要る。測り直
 * した値が前と同じなら**同じ参照を返して再レンダーを止める**。
 *
 * 拾えないのは**再レンダーを伴わない位置変化**（Web フォントや画像の読み込み完了）。ウ
 * ィンドウの大きさの変化だけは再レンダーが起きないので明示的に購読する。
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
  const [bounds, setBounds] = useState<Option<RotatedBounds>>(Option.none);

  useLayoutEffect(() => {
    const remeasure = () => {
      setBounds((previous) => {
        const next = measure(target, container.current, basis);
        return isSame(previous, next) ? previous : next;
      });
    };

    remeasure();
    /*
     * 購読も毎コミット張り直す。`[]` で 1 度だけ張ると、リスナーが最初の
     * `target` を掴んだままになり、選択を変えたあとに古い名前を測り続ける。
     */
    globalThis.window.addEventListener("resize", remeasure);
    return () => globalThis.window.removeEventListener("resize", remeasure);
  });

  return bounds;
}

import { type RefObject, useLayoutEffect, useState } from "react";
import { CanvasBounds } from "@/features/canvas/domains/node-drop";
import { DrawnBounds } from "@/features/canvas/utils/DrawnBounds";
import { Option } from "@/utils/Option";

/**
 * 器からの相対に置き直した、名前で指した要素の矩形。
 *
 * @param target 測りたい要素の名前。未選択なら `none`
 * @param container 座標の原点にする器
 * @returns 器の左上を原点にした矩形。名前が無い / 要素が出ていない / 器がまだ
 *   マウントされていなければ `none`
 */
function measure(
  target: Option<string>,
  container: HTMLElement | null,
): Option<CanvasBounds> {
  if (container === null) {
    return Option.none;
  }
  const origin = CanvasBounds.ofElement(container);
  return Option.map(Option.flatMap(target, DrawnBounds.measure), (bounds) =>
    CanvasBounds.relativeTo(bounds, origin),
  );
}

/**
 * 2 つの結果が同じものを指しているか。
 *
 * @param previous 前に持っていた結果
 * @param next 測り直した結果
 * @returns どちらも不在か、同じ矩形を指していれば `true`
 */
function isSame(
  previous: Option<CanvasBounds>,
  next: Option<CanvasBounds>,
): boolean {
  if (!previous.some || !next.some) {
    return previous.some === next.some;
  }
  return CanvasBounds.equals(previous.value, next.value);
}

/**
 * 描かれている矩形を、変わるたびに追いかけて返す
 * （リサイズハンドルを辺に重ねるために使う）。
 *
 * **依存配列を持たず毎コミット測り直す。** 位置が動く原因はキャンバス自身の
 * ドキュメント / 倍率だけでなく、トークン選択やエラー一覧の出入りで中央ペインの
 * 高さが変わることでも起きる。原因を列挙して deps に並べると、上流の状態が増える
 * たびに追随が要る。測り直した値が前と同じなら**同じ参照を返して再レンダーを止める**
 * ので、毎コミット測っても繰り返しにはならない。
 *
 * 拾えないのは**再レンダーを伴わない位置変化**（Web フォントや画像の読み込み完了）。
 * ウィンドウの大きさの変化だけは再レンダーが起きないので明示的に購読する。
 *
 * @param target 追いかける artboard / ノードの名前。未選択なら `none`
 * @param container 座標の原点にする器（ハンドルを重ねる側の要素）
 * @returns 器からの相対で表した矩形。測れなければ `none`
 */
export function useDrawnBounds(
  target: Option<string>,
  container: RefObject<HTMLElement | null>,
): Option<CanvasBounds> {
  const [bounds, setBounds] = useState<Option<CanvasBounds>>(Option.none);

  useLayoutEffect(() => {
    const remeasure = () => {
      setBounds((previous) => {
        const next = measure(target, container.current);
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

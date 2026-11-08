import type { CanvasDom } from "@/libs/canvas-dom";

/**
 * 要素の実測（`getBoundingClientRect` / `offsetWidth` / `offsetHeight`）を差し替える。
 * 測る側は `CanvasDom.boundsOf` / `CanvasDom.layoutSizeOf`。
 *
 * happy-dom はレイアウトを行わず矩形も大きさもすべて 0 で返すため、**差し替えないと
 * 実測を使う実装を何に壊しても通る**（rules/testing.md「その assert は落ちうるか」）。
 * ここで差し替えるのはブラウザが行う測定だけで、そこから何が決まるかは実物が答える。
 */

/** 差し替える矩形。`CanvasDom.boundsOf` が返す形に揃えている。 */
type MeasuredBounds = ReturnType<typeof CanvasDom.boundsOf>;

/**
 * その要素が描かれている矩形を決める。
 *
 * @param element 測り方を差し替える要素
 * @param bounds その要素が返すことにする矩形
 */
export function stubBounds(element: Element, bounds: MeasuredBounds): void {
  stubBoundsEachMeasure(element, () => bounds);
}

/**
 * その要素が測られるたびに `measure` を呼び、返した矩形を描かれている矩形にする。
 *
 * @param element 測り方を差し替える要素
 * @param measure 測られるたびに呼ばれ、そのとき返すことにする矩形を返す関数
 */
export function stubBoundsEachMeasure(
  element: Element,
  measure: () => MeasuredBounds,
): void {
  element.getBoundingClientRect = () => {
    const bounds = measure();
    return new DOMRect(bounds.left, bounds.top, bounds.width, bounds.height);
  };
}

/**
 * その要素の、変形を効かせる前のレイアウトの大きさを決める（`offsetWidth` / `offsetHeight`）。
 * 回った要素の回る前の大きさは外接矩形からは決まらないので、回ったものを測るテストは
 * `stubBounds` と合わせてこれも差し替える。
 *
 * @param element 測り方を差し替える要素
 * @param size その要素が返すことにする幅と高さ
 */
export function stubLayoutSize(
  element: HTMLElement,
  size: Readonly<{ width: number; height: number }>,
): void {
  Object.defineProperty(element, "offsetWidth", {
    configurable: true,
    value: size.width,
  });
  Object.defineProperty(element, "offsetHeight", {
    configurable: true,
    value: size.height,
  });
}

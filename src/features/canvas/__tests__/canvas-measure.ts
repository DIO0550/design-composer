import { ElementNameAttribute } from "@/domains/compiled/compiled-element";
import type { CanvasBounds } from "@/features/canvas/domains/canvas-bounds";

/**
 * キャンバスの実測を差し替える。
 *
 * happy-dom はレイアウトを行わず矩形をすべて 0 で返すため、**差し替えないと実測を使う
 * 実装を何に壊しても通る**（rules/testing.md「その assert は落ちうるか」）。
 * ここで差し替えるのはブラウザが行う測定だけで、そこから何が決まるかは実物が答える。
 *
 * キャンバスの実測の差し替えなので、外の feature から使う場合も持ち主であるこの feature
 * に置き、テスト用の公開口（`__tests__/index.ts`）から出す。
 */

/**
 * その要素が描かれている矩形を決める。
 *
 * @param element 測り方を差し替える要素
 * @param bounds その要素が返すことにする矩形
 */
export function stubBounds(element: Element, bounds: CanvasBounds): void {
  element.getBoundingClientRect = () =>
    new DOMRect(bounds.left, bounds.top, bounds.width, bounds.height);
}

/**
 * キャンバスに描かれていることにする要素を置く。
 * 名前で引ける（`CanvasDom.elementOf`）ようにするだけなので、器の外へ置く。
 *
 * @param name 描かれていることにする名前
 * @param bounds その要素が返すことにする矩形
 * @returns 置いた要素
 */
export function drawNamed(name: string, bounds: CanvasBounds): HTMLElement {
  const target = globalThis.document.createElement("div");
  target.setAttribute(ElementNameAttribute, name);
  stubBounds(target, bounds);
  globalThis.document.body.append(target);
  return target;
}

/**
 * `drawNamed` で置いたものを片付ける。テストをまたいで名前が残らないようにする。
 *
 * `drawNamed` は器の外（`document.body`）へ直に足すので、Testing Library の
 * `afterEach(cleanup)` では外れない。使う側は自分で `afterEach(clearDrawn)` を置く。
 */
export function clearDrawn(): void {
  for (const element of globalThis.document.querySelectorAll(
    `[${ElementNameAttribute}]`,
  )) {
    element.remove();
  }
}

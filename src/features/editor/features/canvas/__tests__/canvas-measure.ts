import { ElementNameAttribute } from "@/domains/compiled/compiled-element";
import { drawn } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";

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

/**
 * キャンバスに描かれている要素の、描かれた位置と大きさをテスト用の値にする。
 *
 * **2 つの親の矩形を差し替えていないテストでは、原点のずれが 0 になる。** 付け替えで座
 * 標が直ることを見たいテストは、必ず両方の親をここに通すこと。
 *
 * @param name 描かれているノードの名前
 * @param bounds そのノードが描かれていることにする位置と大きさ
 * @returns 測定を差し替えたあとの要素
 */
export function drawnAt(name: string, bounds: CanvasBounds): HTMLElement {
  const element = drawn(name);
  stubBounds(element, bounds);
  return element;
}

/**
 * 回って描かれているノードとして描く。外接矩形を描かれた矩形にし、回る前の大きさを
 * レイアウトの大きさにする（外接矩形からは回る前の大きさが決まらないため）。
 *
 * @param name 描かれているノードの名前
 * @param enclosing 回った 4 角を囲む、描かれていることにする矩形
 * @param unrotatedSize 回る前の幅と高さ
 * @returns 測定を差し替えたあとの要素
 */
export function drawnTurnedAt(
  name: string,
  enclosing: CanvasBounds,
  unrotatedSize: Readonly<{ width: number; height: number }>,
): HTMLElement {
  const element = drawnAt(name, enclosing);
  stubLayoutSize(element, unrotatedSize);
  return element;
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

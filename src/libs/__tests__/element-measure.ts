import { ElementNameAttribute } from "@/domains/compiled/compiled-element";
import type { CanvasDom } from "@/libs/canvas-dom";

/**
 * 要素の実測（`getBoundingClientRect` / `offsetWidth` / `offsetHeight` / `getComputedStyle` の
 * 幅と高さ）を差し替える。測る側は `CanvasDom.boundsOf` / `CanvasDom.layoutSizeOf` /
 * `CanvasDom.layoutSizeFor`。
 *
 * happy-dom はレイアウトを行わず、矩形も大きさもすべて 0 で返し、計算値の幅と高さはインラインの
 * 綴りをそのまま返す（`fit-content` も）ため、**差し替えないと実測を使う実装を何に壊しても通る**
 * （rules/testing.md「その assert は落ちうるか」）。
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

/** 差し替える前の `getComputedStyle`。差し替えていなければ `undefined`。 */
let originalGetComputedStyle: typeof globalThis.getComputedStyle | undefined;

/**
 * 計算値の幅と高さの決め方。測られるたびに、その時点のインラインの `style`（当てた長さを含む）
 * から、返すことにする幅と高さを決める。
 */
type ComputedSizeFor = (
  inline: CSSStyleDeclaration,
) => Readonly<{ width: number; height: number }>;

/** 名前ごとの、計算値の幅と高さの決め方。 */
const computedSizeByName = new Map<string, ComputedSizeFor>();

/**
 * その名前で描かれた要素の、計算値の幅と高さを決める（`getComputedStyle`）。ほかの要素と
 * ほかのプロパティは差し替える前の `getComputedStyle` が答える。
 *
 * 要素ではなく名前で引くのは、ドキュメントが変わるたびにキャンバスの要素が作り直され、要素に
 * 差し替えた測り方は次の描き直しで消えるため。差し替えはテストをまたいで残るので、使う側は
 * `afterEach(restoreComputedSize)` を置く。
 *
 * @param name 測り方を差し替える要素の名前
 * @param sizeFor 返すことにする幅と高さの決め方
 */
export function stubComputedSizeOf(
  name: string,
  sizeFor: ComputedSizeFor,
): void {
  computedSizeByName.set(name, sizeFor);
  if (originalGetComputedStyle !== undefined) {
    return;
  }
  const original = globalThis.getComputedStyle;
  originalGetComputedStyle = original;
  globalThis.getComputedStyle = (element, pseudoElement) => {
    const computed = original(element, pseudoElement);
    const stubbed = computedSizeByName.get(
      element.getAttribute(ElementNameAttribute) ?? "",
    );
    if (stubbed === undefined) {
      return computed;
    }
    if (!(element instanceof HTMLElement)) {
      return computed;
    }
    const size = stubbed(element.style);
    Object.defineProperty(computed, "width", {
      configurable: true,
      value: `${size.width}px`,
    });
    Object.defineProperty(computed, "height", {
      configurable: true,
      value: `${size.height}px`,
    });
    return computed;
  };
}

/** `stubComputedSizeOf` で差し替えた `getComputedStyle` を、差し替える前へ戻す。 */
export function restoreComputedSize(): void {
  computedSizeByName.clear();
  if (originalGetComputedStyle === undefined) {
    return;
  }
  globalThis.getComputedStyle = originalGetComputedStyle;
  originalGetComputedStyle = undefined;
}

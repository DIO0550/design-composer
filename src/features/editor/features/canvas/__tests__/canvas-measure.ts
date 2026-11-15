import { ElementNameAttribute } from "@/domains/compiled/compiled-element";
import { drawn } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import {
  stubBounds,
  stubComputedSizeOf,
  stubLayoutSize,
} from "@/libs/__tests__/element-measure";

/**
 * キャンバスに描かれた要素を、測定を差し替えた状態で用意する。
 * 測定の差し替えそのものと理由は `@/libs/__tests__/element-measure`。
 */

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
 * 名前で指したノードを、回る前の幅を当てると高さが連れて変わるものとして測らせる
 * （`stubComputedSizeOf`）。幅 200 なら高さ 100、それ以外なら 80。
 *
 * 差し替えはテストをまたいで残るので、使う側は `afterEach(restoreComputedSize)` を置く。
 *
 * @param name 測り方を差し替えるノードの名前
 */
export function stubHeightFollowingWidth(name: string): void {
  stubComputedSizeOf(name, (inline) => ({
    width: Number.parseFloat(inline.width),
    height: inline.width === "200px" ? 100 : 80,
  }));
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

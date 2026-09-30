import { expect, test } from "vitest";
import { CanvasDom } from "../index";

/**
 * 実測がその矩形を返す要素を作る。
 *
 * happy-dom はレイアウトを行わず矩形をすべて 0 で返すため、差し替えないと何を返しても通る。
 * 4 値をすべて違う値にして、取り違えても落ちるようにする。
 */
function stubbedElement(): Element {
  const element = globalThis.document.createElement("div");
  element.getBoundingClientRect = () => new DOMRect(10, 20, 30, 40);
  return element;
}

test("描かれている要素の矩形を client 座標の位置と大きさで返す", () => {
  const bounds = CanvasDom.boundsOf(stubbedElement());

  expect(bounds).toEqual({ left: 10, top: 20, width: 30, height: 40 });
});

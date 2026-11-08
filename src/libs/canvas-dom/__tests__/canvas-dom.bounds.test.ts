import { expect, test } from "vitest";
import { stubBounds } from "@/libs/__tests__/element-measure";
import { CanvasDom } from "../index";

/**
 * 実測がその矩形を返す要素を作る。
 *
 * 4 値をすべて違う値にして、取り違えても落ちるようにする。
 */
function stubbedElement(): Element {
  const element = globalThis.document.createElement("div");
  stubBounds(element, { left: 10, top: 20, width: 30, height: 40 });
  return element;
}

test("描かれている要素の矩形を client 座標の位置と大きさで返す", () => {
  const bounds = CanvasDom.boundsOf(stubbedElement());

  expect(bounds).toEqual({ left: 10, top: 20, width: 30, height: 40 });
});

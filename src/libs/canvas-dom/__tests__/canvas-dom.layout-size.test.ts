import { afterEach, expect, test } from "vitest";
import { AxisLength } from "@/domains/dcmp/axis-length";
import { Option } from "@/utils/Option";
import { CanvasDom } from "../index";

/*
 * 長さを当てて測る（`CanvasDom.layoutSizeFor`）。happy-dom の計算値はインラインの綴りを
 * そのまま返すので、当てた長さが計算値へ届くか・測り終えたあと元へ戻るかを実物で見る。
 */

/**
 * インラインの `style` を持つ要素を描く。
 *
 * @param style 要素の `style` 属性の文字列
 * @returns 描いた要素
 */
function drawnWithStyle(style: string): HTMLElement {
  const element = globalThis.document.createElement("div");
  element.setAttribute("style", style);
  globalThis.document.body.append(element);
  return element;
}

afterEach(() => {
  globalThis.document.body.innerHTML = "";
});

test("幅 200 の要素に幅 120 を当てると、当てた幅と今の高さで測れる", () => {
  const element = drawnWithStyle("width: 200px; height: 100px");

  expect(
    CanvasDom.layoutSizeFor(element, [AxisLength.create("width", 120)]),
  ).toEqual(Option.some({ width: 120, height: 100 }));
});

test("両軸に当てても、測り終えると style 属性が測る前と同じ文字列に戻る", () => {
  const before = "height:100px;width :200px; transform: rotate(30deg)";
  const element = drawnWithStyle(before);

  CanvasDom.layoutSizeFor(element, [
    AxisLength.create("width", 120),
    AxisLength.create("height", 80),
  ]);

  expect(element.getAttribute("style")).toBe(before);
});

test("style 属性の無い要素に長さを当てて測っても、測り終えると style 属性が無いまま", () => {
  const element = globalThis.document.createElement("div");
  globalThis.document.body.append(element);

  CanvasDom.layoutSizeFor(element, [AxisLength.create("width", 120)]);

  expect(element.hasAttribute("style")).toBe(false);
});

test("インライン指定の無い高さは、当てて測ったあとも指定が無いまま戻る", () => {
  const element = drawnWithStyle("width: 200px");

  const measured = CanvasDom.layoutSizeFor(element, [
    AxisLength.create("width", 120),
    AxisLength.create("height", 80),
  ]);

  // 当てた高さで測れたうえで（測れていなければ戻すところまで届いたかが分からない）、指定は残らない
  expect([measured, element.style.height]).toEqual([
    Option.some({ width: 120, height: 80 }),
    "",
  ]);
});

test("HTML の要素でない SVG は測れない", () => {
  const svg = globalThis.document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  svg.setAttribute("style", "width: 200px; height: 100px");
  globalThis.document.body.append(svg);

  expect(
    CanvasDom.layoutSizeFor(svg, [AxisLength.create("width", 120)]),
  ).toEqual(Option.none);
});

test("高さが px で読めない（fit-content の）要素は測れない", () => {
  const element = drawnWithStyle("width: 200px; height: fit-content");

  expect(
    CanvasDom.layoutSizeFor(element, [AxisLength.create("width", 120)]),
  ).toEqual(Option.none);
});

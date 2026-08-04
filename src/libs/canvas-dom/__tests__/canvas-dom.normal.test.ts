import { afterEach, expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { CanvasDom } from "../index";

/**
 * キャンバスが描いた結果に相当する DOM を置く。
 * 中身はコンパイル結果の HTML をそのまま流し込んだもの（React の管理外）なので、
 * ここでも文字列から組み立てる。
 */
function drawCanvas(html: string): void {
  globalThis.document.body.innerHTML = html;
}

afterEach(() => {
  globalThis.document.body.innerHTML = "";
});

test("名前で描かれている要素を引ける", () => {
  drawCanvas('<div data-name="home"><div data-name="panel"></div></div>');

  const found = CanvasDom.elementOf("panel");

  expect(found.some && found.value.getAttribute("data-name")).toBe("panel");
});

test("入れ子の外側にある要素も名前で引ける", () => {
  drawCanvas('<div data-name="home"><div data-name="panel"></div></div>');

  const found = CanvasDom.elementOf("home");

  expect(found.some && found.value.getAttribute("data-name")).toBe("home");
});

test("描かれていない名前を指すと要素は無い", () => {
  drawCanvas('<div data-name="home"></div>');

  expect(CanvasDom.elementOf("missing")).toEqual(Option.none);
});

test("何も描かれていないキャンバスでは要素は無い", () => {
  drawCanvas("");

  expect(CanvasDom.elementOf("home")).toEqual(Option.none);
});

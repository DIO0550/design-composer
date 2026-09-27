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

/** 同じ名前のノードを中に持つ部品を 2 回置いたキャンバス。 */
const TwoCardsHtml =
  '<div data-name="first-card"><p data-name="card-title">1</p></div>' +
  '<div data-name="second-card"><p data-name="card-title">2</p></div>';

afterEach(() => {
  globalThis.document.body.innerHTML = "";
});

test("名前で描かれている要素を引ける", () => {
  drawCanvas('<div data-name="home"><div data-name="panel"></div></div>');

  const found = CanvasDom.elementOf("panel");

  expect(Option.isSome(found) && found.value.getAttribute("data-name")).toBe(
    "panel",
  );
});

test("入れ子の外側にある要素も名前で引ける", () => {
  drawCanvas('<div data-name="home"><div data-name="panel"></div></div>');

  const found = CanvasDom.elementOf("home");

  expect(Option.isSome(found) && found.value.getAttribute("data-name")).toBe(
    "home",
  );
});

test("描かれていない名前を指すと要素は無い", () => {
  drawCanvas('<div data-name="home"></div>');

  expect(CanvasDom.elementOf("missing")).toEqual(Option.none);
});

test("何も描かれていないキャンバスでは要素は無い", () => {
  drawCanvas("");

  expect(CanvasDom.elementOf("home")).toEqual(Option.none);
});

test("同じ名前が複数描かれていると、DOM の並びで最初のものを引く", () => {
  drawCanvas(TwoCardsHtml);

  const found = CanvasDom.elementOf("card-title");

  expect(Option.isSome(found) && found.value.textContent).toBe("1");
});

test("選択子は、その名前で描かれている要素すべてに当たる", () => {
  drawCanvas(TwoCardsHtml);

  const found = globalThis.document.querySelectorAll(
    CanvasDom.selectorOf("card-title"),
  );

  expect(Array.from(found, (element) => element.textContent)).toEqual([
    "1",
    "2",
  ]);
});

test("選択子は、別の名前で描かれている要素には当たらない", () => {
  drawCanvas('<div data-name="home"><div data-name="panel"></div></div>');

  const found = globalThis.document.querySelectorAll(
    CanvasDom.selectorOf("panel"),
  );

  expect(
    Array.from(found, (element) => element.getAttribute("data-name")),
  ).toEqual(["panel"]);
});

import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { Option } from "@/utils/Option";
import { NodeResize } from "../index";

/**
 * `home` に、2 軸とも固定の `panel`、幅だけ固定の `column`、モードを持たない `title`、
 * 幅を固定と書きながら長さの無い `broken`、部品インスタンスの `action`、
 * 絶対配置の `badge` が並ぶドキュメント。`home` の次に座標を持たない `about` が続く。
 */
function setupSelection(
  selectedNames: readonly string[] = [],
): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      components: {
        card: { type: "Box", children: [] },
      },
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          canvasPosition: { x: 40, y: 90 },
          children: [
            {
              name: "panel",
              type: "Box",
              props: {
                widthMode: "fixed",
                width: 120,
                heightMode: "fixed",
                height: 80,
              },
              children: [],
            },
            {
              name: "column",
              type: "Box",
              props: { widthMode: "fixed", width: 200, heightMode: "hug" },
              children: [],
            },
            { name: "title", type: "Text", props: { content: "ホーム" } },
            {
              name: "broken",
              type: "Box",
              props: { widthMode: "fixed" },
              children: [],
            },
            { name: "action", ref: "card" },
            {
              name: "badge",
              type: "Box",
              props: {
                widthMode: "fixed",
                width: 60,
                heightMode: "fixed",
                height: 24,
                placement: "absolute",
                x: 12,
                y: 34,
              },
              children: [],
            },
          ],
        },
        { name: "about", width: 300, height: 200, children: [] },
      ],
    }),
    selectedNames,
  );
}

function handlesOf(name: string): readonly string[] {
  return NodeResize.resizable(setupSelection([name])).lengths.map(
    (handle) => handle.axis,
  );
}

function originOf(name: string) {
  return NodeResize.resizable(setupSelection([name])).origin;
}

test("何も選んでいないときはハンドルが出ない", () => {
  expect(NodeResize.resizable(setupSelection()).lengths).toEqual([]);
});

test("2 軸とも fixed のノードは幅と高さの両方のハンドルが出る", () => {
  expect(handlesOf("panel")).toEqual(["width", "height"]);
});

test("片方の軸だけ fixed のノードはその軸のハンドルだけが出る", () => {
  expect(handlesOf("column")).toEqual(["width"]);
});

test("モードを指定していないノードはハンドルが出ない", () => {
  expect(handlesOf("title")).toEqual([]);
});

test("fixed でも長さが決まっていない軸のハンドルは出ない", () => {
  expect(handlesOf("broken")).toEqual([]);
});

test("部品インスタンスにはハンドルが出ない", () => {
  expect(handlesOf("action")).toEqual([]);
});

test("artboard は常に幅と高さの両方のハンドルが出る", () => {
  expect(handlesOf("home")).toEqual(["width", "height"]);
});

test("ハンドルは掴んだ時点の長さを持つ", () => {
  expect(NodeResize.resizable(setupSelection(["panel"])).lengths).toEqual([
    { axis: "width", length: 120 },
    { axis: "height", length: 80 },
  ]);
});

test("artboard のハンドルは artboard 自身の大きさを持つ", () => {
  expect(NodeResize.resizable(setupSelection(["home"])).lengths).toEqual([
    { axis: "width", length: 360 },
    { axis: "height", length: 240 },
  ]);
});

test("絶対配置のノードは親から見た座標を掴んだ時点の位置として持つ", () => {
  // 親の artboard は (40, 90) に置かれているので、キャンバス座標を返す実装なら落ちる
  expect(originOf("badge")).toEqual(Option.some({ x: 12, y: 34 }));
});

test("フロー配置のノードは位置を持たない", () => {
  expect(originOf("panel")).toEqual(Option.none);
});

test("座標を書いた artboard はその座標を位置として持つ", () => {
  expect(originOf("home")).toEqual(Option.some({ x: 40, y: 90 }));
});

test("座標を書いていない artboard は自動配置で置かれる位置を持つ", () => {
  // 先頭ではなく 2 枚目を見る（先頭だと原点になり、自動配置を壊しても通る）
  expect(originOf("about")).toEqual(Option.some({ x: 392, y: 0 }));
});

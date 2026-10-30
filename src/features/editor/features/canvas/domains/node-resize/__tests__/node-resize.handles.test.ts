import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { Option } from "@/utils/Option";
import { NodeResize } from "../index";

/**
 * `home` に、2 軸とも固定の `panel`、幅だけ固定の `column`、大きさのモードを持たない Text の
 * `title`、幅を固定と書きながら長さの無い `broken`、部品インスタンスの `action`、
 * モードを書かずに長さだけを書いた Ellipse の `oval`、何も書かない Ellipse の `dot`、
 * 高さだけ `fill` の Ellipse の `bar`、モードを書かずに長さだけを書いた Box の `plain`、
 * スキーマに無い `widthMode` を書いた Text の `caption`、スキーマに無い type の `mystery`、
 * 絶対配置の `badge`、2 軸とも固定でロックした `locked-panel`（中に 2 軸とも固定の
 * `locked-child`）、2 軸とも固定で非表示の `hidden-panel`（中に 2 軸とも固定の `hidden-child`）
 * が並ぶドキュメント。`home` の次に座標を持たない `about` が続く。
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
              name: "oval",
              type: "Ellipse",
              props: { width: 140, height: 72 },
            },
            { name: "dot", type: "Ellipse", props: {} },
            { name: "bar", type: "Ellipse", props: { heightMode: "fill" } },
            {
              name: "plain",
              type: "Box",
              props: { width: 120, height: 80 },
              children: [],
            },
            {
              name: "caption",
              type: "Text",
              props: { content: "注記", widthMode: "fixed", width: 120 },
            },
            {
              name: "mystery",
              type: "Unknown",
              props: { widthMode: "fixed", width: 120 },
            },
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
            {
              name: "locked-panel",
              type: "Box",
              props: {
                widthMode: "fixed",
                width: 120,
                heightMode: "fixed",
                height: 80,
                locking: "locked",
              },
              children: [
                {
                  name: "locked-child",
                  type: "Box",
                  props: {
                    widthMode: "fixed",
                    width: 120,
                    heightMode: "fixed",
                    height: 80,
                  },
                  children: [],
                },
              ],
            },
            {
              name: "hidden-panel",
              type: "Box",
              props: {
                widthMode: "fixed",
                width: 120,
                heightMode: "fixed",
                height: 80,
                visibility: "hidden",
              },
              children: [
                {
                  name: "hidden-child",
                  type: "Box",
                  props: {
                    widthMode: "fixed",
                    width: 120,
                    heightMode: "fixed",
                    height: 80,
                  },
                  children: [],
                },
              ],
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

test("大きさのモードを持たない Text はハンドルが出ない", () => {
  expect(handlesOf("title")).toEqual([]);
});

test("fixed でも長さが決まっていない軸のハンドルは出ない", () => {
  expect(handlesOf("broken")).toEqual([]);
});

test("部品インスタンスにはハンドルが出ない", () => {
  expect(handlesOf("action")).toEqual([]);
});

test("モードを書いていない Ellipse は、書かれた長さで幅と高さの両方のハンドルが出る", () => {
  expect(NodeResize.resizable(setupSelection(["oval"])).lengths).toEqual([
    { axis: "width", length: 140 },
    { axis: "height", length: 72 },
  ]);
});

test("何も書いていない Ellipse は、既定の長さで幅と高さの両方のハンドルが出る", () => {
  expect(NodeResize.resizable(setupSelection(["dot"])).lengths).toEqual([
    { axis: "width", length: 100 },
    { axis: "height", length: 100 },
  ]);
});

test("高さを fill にした Ellipse は幅のハンドルだけが出る", () => {
  expect(handlesOf("bar")).toEqual(["width"]);
});

test("モードを書かずに長さだけを書いた Box は、既定が hug なのでハンドルが出ない", () => {
  expect(handlesOf("plain")).toEqual([]);
});

test("スキーマに無い widthMode を書いた Text はハンドルが出ない", () => {
  expect(handlesOf("caption")).toEqual([]);
});

test("スキーマに無い type のノードはハンドルが出ない", () => {
  expect(handlesOf("mystery")).toEqual([]);
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

test("ロックしたノードを選んでいるとハンドルが出ない", () => {
  expect(handlesOf("locked-panel")).toEqual([]);
});

test("ロックした Box の子を選んでいてもハンドルが出ない", () => {
  expect(handlesOf("locked-child")).toEqual([]);
});

test("非表示のノードを選んでいるとハンドルが出ない", () => {
  expect(handlesOf("hidden-panel")).toEqual([]);
});

test("非表示の Box の子を選んでいてもハンドルが出ない", () => {
  expect(handlesOf("hidden-child")).toEqual([]);
});

import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import { NodeResize } from "../index";

/**
 * `home` に、2 軸とも固定の `panel`、幅だけ固定の `column`、モードを持たない `title`、
 * 幅を固定と書きながら長さの無い `broken`、部品インスタンスの `action` が並ぶドキュメント。
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
          ],
        },
      ],
    }),
    selectedNames,
  );
}

function handlesOf(name: string): readonly string[] {
  return NodeResize.handles(setupSelection([name])).map(
    (handle) => handle.axis,
  );
}

test("何も選んでいないときはハンドルが出ない", () => {
  expect(NodeResize.handles(setupSelection())).toEqual([]);
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
  expect(NodeResize.handles(setupSelection(["panel"]))).toEqual([
    { axis: "width", length: 120 },
    { axis: "height", length: 80 },
  ]);
});

test("artboard のハンドルは artboard 自身の大きさを持つ", () => {
  expect(NodeResize.handles(setupSelection(["home"]))).toEqual([
    { axis: "width", length: 360 },
    { axis: "height", length: 240 },
  ]);
});

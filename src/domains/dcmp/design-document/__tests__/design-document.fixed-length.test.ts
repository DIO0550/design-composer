import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { DesignDocument } from "../index";

/**
 * 大きさの書き方が違うノードを、360 x 240 の artboard `home` の直下に並べたドキュメント。
 * `instance` は部品 `chip` のインスタンス、`unknown` はスキーマに無い type、`label` は
 * スキーマに無い `widthMode` / `width` を書いた Text。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    components: {
      chip: {
        type: "Box",
        props: { widthMode: "fixed", width: 80 },
        children: [],
      },
    },
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "oval",
            type: "Ellipse",
            props: { width: 140, height: 72 },
          },
          { name: "dot", type: "Ellipse", props: {} },
          {
            name: "stretched",
            type: "Ellipse",
            props: { widthMode: "fill", width: 140 },
          },
          {
            name: "plain",
            type: "Box",
            props: { width: 120, height: 80 },
            children: [],
          },
          {
            name: "unsized",
            type: "Box",
            props: { widthMode: "fixed" },
            children: [],
          },
          {
            name: "unknown",
            type: "Unknown",
            props: { widthMode: "fixed", width: 120 },
          },
          {
            name: "label",
            type: "Text",
            props: { widthMode: "fixed", width: 120 },
          },
          { name: "instance", ref: "chip" },
        ],
      },
    ],
  });
}

test("artboard はその幅を答える", () => {
  expect(
    DesignDocument.fixedLengthOf(setupDocument(), "home", "width"),
  ).toEqual(Option.some(360));
});

test("artboard はその高さを答える", () => {
  expect(
    DesignDocument.fixedLengthOf(setupDocument(), "home", "height"),
  ).toEqual(Option.some(240));
});

test("大きさのモードを書いていない Ellipse は、書かれた幅を答える", () => {
  expect(
    DesignDocument.fixedLengthOf(setupDocument(), "oval", "width"),
  ).toEqual(Option.some(140));
});

test("大きさのモードを書いていない Ellipse は、書かれた高さを答える", () => {
  expect(
    DesignDocument.fixedLengthOf(setupDocument(), "oval", "height"),
  ).toEqual(Option.some(72));
});

test("長さもモードも書いていない Ellipse は、既定の長さを答える", () => {
  expect(DesignDocument.fixedLengthOf(setupDocument(), "dot", "width")).toEqual(
    Option.some(100),
  );
});

test("長さだけを書いた Box は、既定のモードが hug なので答えない", () => {
  expect(
    DesignDocument.fixedLengthOf(setupDocument(), "plain", "width"),
  ).toEqual(Option.none);
});

test("モードを fixed にしただけの Box は、長さも既定も無いので答えない", () => {
  expect(
    DesignDocument.fixedLengthOf(setupDocument(), "unsized", "width"),
  ).toEqual(Option.none);
});

test("fill を明示した Ellipse の軸は、長さが書いてあっても答えない", () => {
  expect(
    DesignDocument.fixedLengthOf(setupDocument(), "stretched", "width"),
  ).toEqual(Option.none);
});

test("部品インスタンスは長さを答えない", () => {
  expect(
    DesignDocument.fixedLengthOf(setupDocument(), "instance", "width"),
  ).toEqual(Option.none);
});

test("スキーマに無い type のノードは、fixed と長さを書いていても答えない", () => {
  expect(
    DesignDocument.fixedLengthOf(setupDocument(), "unknown", "width"),
  ).toEqual(Option.none);
});

test("スキーマに無い大きさの prop を書いた Text は、fixed と長さを書いていても答えない", () => {
  expect(
    DesignDocument.fixedLengthOf(setupDocument(), "label", "width"),
  ).toEqual(Option.none);
});

test("ドキュメントに無い名前は長さを答えない", () => {
  expect(
    DesignDocument.fixedLengthOf(setupDocument(), "missing", "width"),
  ).toEqual(Option.none);
});

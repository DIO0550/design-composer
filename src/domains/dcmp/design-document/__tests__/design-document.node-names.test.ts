import { expect, test } from "vitest";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";

/**
 * `home` の直下に `title` と、部品 `primary-button` のインスタンス `login`、その隣に
 * Box の `card`（中に `label`）が並ぶ。部品定義の中のノード名を、木に無い名前として
 * 混ぜられるようにする。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          { name: "title", type: "Text" },
          { name: "login", ref: "primary-button" },
          {
            name: "card",
            type: "Box",
            children: [{ name: "label", type: "Text" }],
          },
        ],
      },
    ],
  });
}

/**
 * 部品 `primary-button` の定義の中にあるノードの名前（`DocumentTemplate.Default`）。キャン
 * バスにはインスタンス `login` の中身として描かれる。
 */
const ComponentInnerName = "primary-button-label";

test("artboard 配下のノードの名前は、渡した順のまま残る", () => {
  const names = DesignDocument.collectNodeNames(setupDocument(), [
    "label",
    "card",
    "title",
  ]);

  expect(names).toEqual(["label", "card", "title"]);
});

test("artboard 自身の名前は落ちる", () => {
  const names = DesignDocument.collectNodeNames(setupDocument(), [
    "card",
    "home",
  ]);

  expect(names).toEqual(["card"]);
});

test("部品定義の中のノードの名前は落ち、インスタンス自身は残る", () => {
  const names = DesignDocument.collectNodeNames(setupDocument(), [
    ComponentInnerName,
    "login",
    "home",
  ]);

  expect(names).toEqual(["login"]);
});

test("ドキュメントに無い名前は落ちる", () => {
  const names = DesignDocument.collectNodeNames(setupDocument(), [
    "missing",
    "title",
  ]);

  expect(names).toEqual(["title"]);
});

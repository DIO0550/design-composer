import { expect, test } from "vitest";
import { DesignDocument } from "../index";

test("artboard 直下にノードを挿入すると children の指定位置に追加される", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });
  const label = { name: "label", type: "Text" };

  const result = DesignDocument.insertNode(document, "screen", 0, label);

  expect(result.artboards[0].children).toEqual([label]);
});

test("ネストしたノードの子として挿入すると親ノードの children に追加される", () => {
  const label = { name: "label", type: "Text" };
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "box-1", type: "Box", children: [] }],
      },
    ],
  });

  const result = DesignDocument.insertNode(document, "box-1", 0, label);

  expect(result.artboards[0].children).toEqual([
    { name: "box-1", type: "Box", children: [label] },
  ]);
});

test("insertNode は元のドキュメントを変更しない", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  DesignDocument.insertNode(document, "screen", 0, {
    name: "label",
    type: "Text",
  });

  expect(document.artboards[0].children).toEqual([]);
});

test("トップレベルのノードを削除すると artboard の children から取り除かれる", () => {
  const label = { name: "label", type: "Text" };
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [label] }],
  });

  const result = DesignDocument.removeNode(document, "label");

  expect(result.artboards[0].children).toEqual([]);
});

test("ネストしたノードを削除すると親の children から取り除かれる", () => {
  const label = { name: "label", type: "Text" };
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "box-1", type: "Box", children: [label] }],
      },
    ],
  });

  const result = DesignDocument.removeNode(document, "label");

  expect(result.artboards[0].children).toEqual([
    { name: "box-1", type: "Box", children: [] },
  ]);
});

test("同一親内でノードを並べ替えると children の順序が入れ替わる", () => {
  const first = { name: "first", type: "Text" };
  const second = { name: "second", type: "Text" };
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [first, second],
      },
    ],
  });

  const result = DesignDocument.reorderNode(document, "screen", 0, 1);

  expect(result.artboards[0].children).toEqual([second, first]);
});

test("artboard を指定位置に挿入すると配列に追加される", () => {
  const existing = { name: "screen-1", width: 375, height: 812, children: [] };
  const document = DesignDocument.create({ artboards: [existing] });
  const added = { name: "screen-2", width: 375, height: 812, children: [] };

  const result = DesignDocument.insertArtboard(document, 0, added);

  expect(result.artboards).toEqual([added, existing]);
});

test("artboard を削除すると配列から取り除かれる", () => {
  const artboard = { name: "screen", width: 375, height: 812, children: [] };
  const document = DesignDocument.create({ artboards: [artboard] });

  const result = DesignDocument.removeArtboard(document, "screen");

  expect(result.artboards).toEqual([]);
});

test("artboard を並べ替えると配列の順序が入れ替わる", () => {
  const first = { name: "screen-1", width: 375, height: 812, children: [] };
  const second = { name: "screen-2", width: 375, height: 812, children: [] };
  const document = DesignDocument.create({ artboards: [first, second] });

  const result = DesignDocument.reorderArtboard(document, 0, 1);

  expect(result.artboards).toEqual([second, first]);
});

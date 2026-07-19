import { expect, test } from "vitest";
import { DesignDocument } from "../index";

test("Text ノードへ挿入しようとするとエラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "label", type: "Text" }],
      },
    ],
  });

  expect(() =>
    DesignDocument.insertNode(document, "label", 0, {
      name: "inner",
      type: "Text",
    }),
  ).toThrow();
});

test("ref ノードへ挿入しようとするとエラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "button", ref: "primary-button" }],
      },
    ],
  });

  expect(() =>
    DesignDocument.insertNode(document, "button", 0, {
      name: "inner",
      type: "Text",
    }),
  ).toThrow();
});

test("存在しない親名を指定してノードを挿入するとエラーになる", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  expect(() =>
    DesignDocument.insertNode(document, "missing-parent", 0, {
      name: "label",
      type: "Text",
    }),
  ).toThrow();
});

test("範囲外の index を指定してノードを挿入するとエラーになる", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  expect(() =>
    DesignDocument.insertNode(document, "screen", 1, {
      name: "label",
      type: "Text",
    }),
  ).toThrow();
});

test("存在しないノード名を指定して削除するとエラーになる", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  expect(() => DesignDocument.removeNode(document, "missing")).toThrow();
});

test("範囲外の fromIndex を指定してノードを並べ替えるとエラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "label", type: "Text" }],
      },
    ],
  });

  expect(() => DesignDocument.reorderNode(document, "screen", 5, 0)).toThrow();
});

test("存在しない artboard 名を指定して削除するとエラーになる", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  expect(() => DesignDocument.removeArtboard(document, "missing")).toThrow();
});

test("範囲外の index を指定して artboard を並べ替えるとエラーになる", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  expect(() => DesignDocument.reorderArtboard(document, 0, 3)).toThrow();
});

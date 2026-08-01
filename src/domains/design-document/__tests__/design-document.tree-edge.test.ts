import { expect, test } from "vitest";
import { DesignDocument } from "../index";

test("Text ノードへ挿入しようとすると children-not-allowed エラーになる", () => {
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

  const result = DesignDocument.insertNode(
    document,
    { parentName: "label", index: 0 },
    { name: "inner", type: "Text" },
  );

  expect(result).toEqual({
    ok: false,
    error: { kind: "children-not-allowed", name: "label" },
  });
});

test("ref ノードへ挿入しようとすると children-not-allowed エラーになる", () => {
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

  const result = DesignDocument.insertNode(
    document,
    { parentName: "button", index: 0 },
    { name: "inner", type: "Text" },
  );

  expect(result).toEqual({
    ok: false,
    error: { kind: "children-not-allowed", name: "button" },
  });
});

test("存在しない親名を指定してノードを挿入すると parent-not-found エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  const result = DesignDocument.insertNode(
    document,
    { parentName: "missing-parent", index: 0 },
    { name: "label", type: "Text" },
  );

  expect(result).toEqual({
    ok: false,
    error: { kind: "parent-not-found", name: "missing-parent" },
  });
});

test("範囲外の index を指定してノードを挿入すると index-out-of-range エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  const result = DesignDocument.insertNode(
    document,
    { parentName: "screen", index: 1 },
    { name: "label", type: "Text" },
  );

  expect(result).toEqual({
    ok: false,
    error: { kind: "index-out-of-range", index: 1, length: 0 },
  });
});

test("存在しないノード名を指定して削除すると node-not-found エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  const result = DesignDocument.removeNode(document, "missing");

  expect(result).toEqual({
    ok: false,
    error: { kind: "node-not-found", name: "missing" },
  });
});

test("範囲外の fromIndex を指定してノードを並べ替えると index-out-of-range エラーになる", () => {
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

  const result = DesignDocument.reorderNode(
    document,
    { parentName: "screen", index: 5 },
    0,
  );

  expect(result).toEqual({
    ok: false,
    error: { kind: "index-out-of-range", index: 5, length: 1 },
  });
});

test("自分自身を移動先に指定して移動しようとすると move-into-descendant エラーになる", () => {
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

  const result = DesignDocument.moveNode(document, "box-1", {
    parentName: "box-1",
    index: 0,
  });

  expect(result).toEqual({
    ok: false,
    error: {
      kind: "move-into-descendant",
      name: "box-1",
      parentName: "box-1",
    },
  });
});

test("自分の子孫を移動先に指定して移動しようとすると move-into-descendant エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          {
            name: "box-1",
            type: "Box",
            children: [{ name: "box-2", type: "Box", children: [] }],
          },
        ],
      },
    ],
  });

  const result = DesignDocument.moveNode(document, "box-1", {
    parentName: "box-2",
    index: 0,
  });

  expect(result).toEqual({
    ok: false,
    error: {
      kind: "move-into-descendant",
      name: "box-1",
      parentName: "box-2",
    },
  });
});

test("存在しないノード名を指定して移動しようとすると node-not-found エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  const result = DesignDocument.moveNode(document, "missing", {
    parentName: "screen",
    index: 0,
  });

  expect(result).toEqual({
    ok: false,
    error: { kind: "node-not-found", name: "missing" },
  });
});

test("存在しない移動先の親名を指定して移動しようとすると parent-not-found エラーになる", () => {
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

  const result = DesignDocument.moveNode(document, "label", {
    parentName: "missing-parent",
    index: 0,
  });

  expect(result).toEqual({
    ok: false,
    error: { kind: "parent-not-found", name: "missing-parent" },
  });
});

test("子を持てないノードへ移動しようとすると children-not-allowed エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "label", type: "Text" },
          { name: "target", type: "Text" },
        ],
      },
    ],
  });

  const result = DesignDocument.moveNode(document, "label", {
    parentName: "target",
    index: 0,
  });

  expect(result).toEqual({
    ok: false,
    error: { kind: "children-not-allowed", name: "target" },
  });
});

test("移動に失敗しても元のドキュメントは変更されない", () => {
  const label = { name: "label", type: "Text" };
  const target = { name: "target", type: "Text" };
  const document = DesignDocument.create({
    artboards: [
      { name: "screen", width: 375, height: 812, children: [label, target] },
    ],
  });

  DesignDocument.moveNode(document, "label", {
    parentName: "target",
    index: 0,
  });

  expect(document.artboards[0].children).toEqual([label, target]);
});

test("存在しない artboard 名を指定して削除すると artboard-not-found エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  const result = DesignDocument.removeArtboard(document, "missing");

  expect(result).toEqual({
    ok: false,
    error: { kind: "artboard-not-found", name: "missing" },
  });
});

test("範囲外の index を指定して artboard を並べ替えると index-out-of-range エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  const result = DesignDocument.reorderArtboard(document, 0, 3);

  expect(result).toEqual({
    ok: false,
    error: { kind: "index-out-of-range", index: 3, length: 1 },
  });
});

test("範囲外の index を指定して artboard を挿入すると index-out-of-range エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  const result = DesignDocument.insertArtboard(document, 5, {
    name: "added",
    width: 375,
    height: 812,
    children: [],
  });

  expect(result).toEqual({
    ok: false,
    error: { kind: "index-out-of-range", index: 5, length: 1 },
  });
});

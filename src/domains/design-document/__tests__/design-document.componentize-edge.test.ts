import { expect, test } from "vitest";
import { DesignDocument } from "../index";

test("存在しないノード名を指定して部品化しようとすると node-not-found エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  const result = DesignDocument.createComponent(document, "missing", "card");

  expect(result).toEqual({
    ok: false,
    error: { kind: "node-not-found", name: "missing" },
  });
});

test("既存の部品名と衝突する名前を指定して部品化しようとすると duplicate-name エラーになる", () => {
  const box = { name: "box-1", type: "Box" };
  const document = DesignDocument.create({
    components: { card: { type: "Box" } },
    artboards: [{ name: "screen", width: 375, height: 812, children: [box] }],
  });

  const result = DesignDocument.createComponent(document, "box-1", "card");

  expect(result).toEqual({
    ok: false,
    error: { kind: "duplicate-name", name: "card" },
  });
});

test("既存のノード名と衝突する名前を指定して部品化しようとすると duplicate-name エラーになる", () => {
  const box = { name: "box-1", type: "Box" };
  const label = { name: "label", type: "Text" };
  const document = DesignDocument.create({
    artboards: [
      { name: "screen", width: 375, height: 812, children: [box, label] },
    ],
  });

  const result = DesignDocument.createComponent(document, "box-1", "label");

  expect(result).toEqual({
    ok: false,
    error: { kind: "duplicate-name", name: "label" },
  });
});

test("既存の artboard 名と衝突する名前を指定して部品化しようとすると duplicate-name エラーになる", () => {
  const box = { name: "box-1", type: "Box" };
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [box] }],
  });

  const result = DesignDocument.createComponent(document, "box-1", "screen");

  expect(result).toEqual({
    ok: false,
    error: { kind: "duplicate-name", name: "screen" },
  });
});

test("ref ノードを部品化しようとすると ref-node-not-supported エラーになる", () => {
  const document = DesignDocument.create({
    components: { button: { type: "Box" } },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "button-1", ref: "button" }],
      },
    ],
  });

  const result = DesignDocument.createComponent(document, "button-1", "card");

  expect(result).toEqual({
    ok: false,
    error: { kind: "ref-node-not-supported", name: "button-1" },
  });
});

test("部品化に失敗しても元のドキュメントは変更されない", () => {
  const box = { name: "box-1", type: "Box" };
  const document = DesignDocument.create({
    components: { card: { type: "Box" } },
    artboards: [{ name: "screen", width: 375, height: 812, children: [box] }],
  });

  DesignDocument.createComponent(document, "box-1", "card");

  expect(document.artboards[0].children).toEqual([box]);
  expect(document.components).toEqual({ card: { type: "Box" } });
});

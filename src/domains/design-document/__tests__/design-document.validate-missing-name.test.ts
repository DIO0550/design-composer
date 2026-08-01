import { expect, test } from "vitest";
import { DesignDocument } from "../index";

test("name が欠落したノードは missing-name エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          // @ts-expect-error AI の直接編集による name 欠落（JSON 由来）を再現する
          { type: "Text" },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "missing-name", nodeName: "screen" }),
  ]);
});

test("name が空文字のノードは missing-name エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "", type: "Text" }],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "missing-name", nodeName: "screen" }),
  ]);
});

test("name が欠落したノードは親の名前と子の位置で報告される", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "label", type: "Text" },
          { name: "", type: "Text" },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "missing-name",
      nodeName: "screen",
      message: 'child 1 of "screen" has no name',
    }),
  ]);
});

test("name が欠落した artboard は missing-name エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "", width: 375, height: 812, children: [] }],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "missing-name", nodeName: "artboards" }),
  ]);
});

test("部品内部のノードの name 欠落も missing-name エラーになる", () => {
  const document = DesignDocument.create({
    components: {
      card: { type: "Box", children: [{ name: "", type: "Text" }] },
    },
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "missing-name", nodeName: "card" }),
  ]);
});

test("name が欠落したノードは識別子規則違反として二重に報告されない", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "", type: "Text" }],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors.map((error) => error.kind)).toEqual(["missing-name"]);
});

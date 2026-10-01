import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "../index";

test("name が欠落したノードは missing-name エラーになる", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
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
    tokens: DocumentTemplate.Default.tokens,
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
    tokens: DocumentTemplate.Default.tokens,
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
    expect.objectContaining({
      kind: "missing-name",
      documentPath: "artboards[0]",
    }),
  ]);
});

test("部品内部のノードの name 欠落も missing-name エラーになる", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
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
    tokens: DocumentTemplate.Default.tokens,
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

test("キーが空の部品は components の中のキーとして報告される", () => {
  const document = DesignDocument.create({
    components: { "": { type: "Box" } },
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "missing-name",
      documentPath: "components",
      message: 'key "" of "components" has no name',
    }),
  ]);
});

test("name が欠落した artboard は artboards の中の位置で報告される", () => {
  const document = DesignDocument.create({
    artboards: [
      { name: "screen", width: 375, height: 812, children: [] },
      { name: "", width: 375, height: 812, children: [] },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "missing-name",
      documentPath: "artboards[1]",
      message: 'artboard 1 of "artboards" has no name',
    }),
  ]);
});

test("name が欠落したノードの子の欠落は、名前を持つ最も近い祖先で報告される", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          {
            name: "",
            type: "Box",
            children: [{ name: "", type: "Box" }],
          },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document).filter(
    (error) => error.kind === "missing-name",
  );

  expect(errors).toEqual([
    expect.objectContaining({ message: 'child 0 of "screen" has no name' }),
    expect.objectContaining({ message: 'child 0 of "screen" has no name' }),
  ]);
});

test("名前を持つ祖先が無いノードの欠落は、空の入れ物名で報告される", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    artboards: [
      {
        name: "",
        width: 375,
        height: 812,
        children: [{ name: "", type: "Text" }],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document).filter(
    (error) => error.kind === "missing-name",
  );

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "missing-name",
      documentPath: "artboards[0]",
    }),
    expect.objectContaining({
      kind: "missing-name",
      nodeName: "",
      message: 'child 0 of "" has no name',
    }),
  ]);
});

test("名前を持つ途中のノードの下の欠落は、そのノードの名前で報告される", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "row", type: "Box", children: [{ name: "", type: "Text" }] },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "missing-name",
      nodeName: "row",
      message: 'child 0 of "row" has no name',
    }),
  ]);
});

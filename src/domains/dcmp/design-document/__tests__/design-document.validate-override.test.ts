import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "../index";

test("publicProps に宣言の無いキーを上書きすると undeclared-override エラーになる", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { label: { node: "button-label", prop: "content" } },
      },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "submit", ref: "button", overrides: { caption: "保存" } },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "undeclared-override",
      nodeName: "submit",
      prop: "caption",
    }),
  ]);
});

test("publicProps を持たない部品への上書きは undeclared-override エラーになる", () => {
  const document = DesignDocument.create({
    components: { button: { type: "Box" } },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "submit", ref: "button", overrides: { label: "保存" } },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "undeclared-override",
      nodeName: "submit",
      prop: "label",
    }),
  ]);
});

test("宣言済みの publicProps を上書きしてもエラーにならない", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { label: { node: "button-label", prop: "content" } },
      },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "submit", ref: "button", overrides: { label: "保存" } },
        ],
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("上書き値が binding 先 prop の enum に無い値だと enum-violation エラーになる", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { textAlign: { node: "button-label", prop: "align" } },
      },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          {
            name: "submit",
            ref: "button",
            overrides: { textAlign: "diagonal" },
          },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "enum-violation",
      nodeName: "submit",
      prop: "textAlign",
    }),
  ]);
});

test("上書き値が binding 先 prop の literalType と異なると literal-type-mismatch エラーになる", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { label: { node: "button-label", prop: "content" } },
      },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "submit", ref: "button", overrides: { label: 100 } },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "literal-type-mismatch",
      nodeName: "submit",
      prop: "label",
    }),
  ]);
});

test("上書き値が存在しないトークン名を指すと dangling-token エラーになる", () => {
  const document = DesignDocument.create({
    components: {
      card: {
        type: "Box",
        children: [{ name: "card-body", type: "Box" }],
        publicProps: { spacing: { node: "card-body", prop: "gap" } },
      },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "panel", ref: "card", overrides: { spacing: "no-such" } },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "dangling-token",
      nodeName: "panel",
      prop: "spacing",
    }),
  ]);
});

test("ネストした部品の publicProps 経由でも上書き値のドメインが継承される", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      label: {
        type: "Text",
        publicProps: { text: { node: "label", prop: "content" } },
      },
      button: {
        type: "Box",
        children: [{ name: "button-label", ref: "label" }],
        publicProps: { title: { node: "button-label", prop: "text" } },
      },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "submit", ref: "button", overrides: { title: 100 } },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "literal-type-mismatch",
      nodeName: "submit",
      prop: "title",
    }),
  ]);
});

test("複数の overrides の違反がすべて報告される", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: {
          label: { node: "button-label", prop: "content" },
          textAlign: { node: "button-label", prop: "align" },
        },
      },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          {
            name: "submit",
            ref: "button",
            overrides: { label: 100, textAlign: "diagonal", extra: "x" },
          },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "literal-type-mismatch", prop: "label" }),
    expect.objectContaining({ kind: "enum-violation", prop: "textAlign" }),
    expect.objectContaining({ kind: "undeclared-override", prop: "extra" }),
  ]);
});

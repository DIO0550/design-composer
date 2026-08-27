import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "../index";

test("循環参照する部品への上書きがあっても検証が終了し循環だけが報告される", () => {
  const document = DesignDocument.create({
    components: {
      a: {
        type: "Box",
        children: [{ name: "a-inner", ref: "b" }],
        publicProps: { title: { node: "a-inner", prop: "title" } },
      },
      b: {
        type: "Box",
        children: [{ name: "b-inner", ref: "a" }],
        publicProps: { title: { node: "b-inner", prop: "title" } },
      },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "panel", ref: "a", overrides: { title: "見出し" } }],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "circular-ref", nodeName: "a" }),
    expect.objectContaining({ kind: "circular-ref", nodeName: "b" }),
  ]);
});

test("dangling ref なノードへ binding していても dangling-ref だけが報告される", () => {
  const document = DesignDocument.create({
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", ref: "no-such-component" }],
        publicProps: { title: { node: "button-label", prop: "text" } },
      },
    },
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "dangling-ref",
      nodeName: "button-label",
    }),
  ]);
});

test("未知の type のノードへ binding していても unknown-type だけが報告される", () => {
  const document = DesignDocument.create({
    components: {
      widget: {
        type: "Box",
        children: [{ name: "widget-inner", type: "NoSuchPrimitive" }],
        publicProps: { title: { node: "widget-inner", prop: "content" } },
      },
    },
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "unknown-type",
      nodeName: "widget-inner",
    }),
  ]);
});

test("overrides を持たない ref ノードはエラーにならない", () => {
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
        children: [{ name: "submit", ref: "button" }],
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

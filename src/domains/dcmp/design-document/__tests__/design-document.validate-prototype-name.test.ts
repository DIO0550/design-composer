import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "../index";

test("存在しない部品 constructor を参照すると dangling-ref エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "instance", ref: "constructor" }],
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({ kind: "dangling-ref", nodeName: "instance" }),
  ]);
});

test("binding 先ノードのスキーマに無い constructor への binding は dangling-binding-prop エラーになる", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { label: { node: "button-label", prop: "constructor" } },
      },
    },
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "dangling-binding-prop",
      nodeName: "button",
      prop: "label",
    }),
  ]);
});

test("部品が公開していない constructor を上書きすると undeclared-override エラーになる", () => {
  const document = DesignDocument.create({
    components: { button: { type: "Box", publicProps: {} } },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "instance", ref: "button", overrides: { constructor: "x" } },
        ],
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "undeclared-override",
      nodeName: "instance",
      prop: "constructor",
    }),
  ]);
});

test("存在しない部品 constructor を参照する内部ノードへの binding は、dangling-ref だけを報告する", () => {
  const document = DesignDocument.create({
    components: {
      card: {
        type: "Box",
        children: [{ name: "card-slot", ref: "constructor" }],
        publicProps: { title: { node: "card-slot", prop: "title" } },
      },
    },
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({ kind: "dangling-ref", nodeName: "card-slot" }),
  ]);
});

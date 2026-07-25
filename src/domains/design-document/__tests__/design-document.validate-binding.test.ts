import { expect, test } from "vitest";
import { DesignDocument } from "../index";

test("存在しない内部ノード名への binding は dangling-binding-node エラーになる", () => {
  const document = DesignDocument.create({
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { label: { node: "no-such-node", prop: "content" } },
      },
    },
  });

  const errors = DesignDocument.validate(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "dangling-binding-node",
      nodeName: "button",
      prop: "label",
    }),
  ]);
});

test("存在しない prop への binding は dangling-binding-prop エラーになる", () => {
  const document = DesignDocument.create({
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { label: { node: "button-label", prop: "no-such-prop" } },
      },
    },
  });

  const errors = DesignDocument.validate(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "dangling-binding-prop",
      nodeName: "button",
      prop: "label",
    }),
  ]);
});

test("binding 先ノードが持たない型の prop への binding は dangling-binding-prop エラーになる", () => {
  const document = DesignDocument.create({
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { spacing: { node: "button-label", prop: "gap" } },
      },
    },
  });

  const errors = DesignDocument.validate(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "dangling-binding-prop",
      nodeName: "button",
      prop: "spacing",
    }),
  ]);
});

test("部品のルートノードへの binding は有効になる", () => {
  const document = DesignDocument.create({
    components: {
      label: {
        type: "Text",
        publicProps: { text: { node: "label", prop: "content" } },
      },
    },
  });

  expect(DesignDocument.validate(document)).toEqual([]);
});

test("内部ノードへの binding は有効になる", () => {
  const document = DesignDocument.create({
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { label: { node: "button-label", prop: "content" } },
      },
    },
  });

  expect(DesignDocument.validate(document)).toEqual([]);
});

test("ネストした部品が公開する publicProps への binding は有効になる", () => {
  const document = DesignDocument.create({
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
  });

  expect(DesignDocument.validate(document)).toEqual([]);
});

test("ネストした部品が公開していない prop への binding は dangling-binding-prop エラーになる", () => {
  const document = DesignDocument.create({
    components: {
      label: {
        type: "Text",
        publicProps: { text: { node: "label", prop: "content" } },
      },
      button: {
        type: "Box",
        children: [{ name: "button-label", ref: "label" }],
        publicProps: { title: { node: "button-label", prop: "content" } },
      },
    },
  });

  const errors = DesignDocument.validate(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "dangling-binding-prop",
      nodeName: "button",
      prop: "title",
    }),
  ]);
});

test("ネストした部品の内部ノードへ直接 binding すると dangling-binding-node エラーになる", () => {
  const document = DesignDocument.create({
    components: {
      label: {
        type: "Box",
        children: [{ name: "label-text", type: "Text" }],
      },
      button: {
        type: "Box",
        children: [{ name: "button-label", ref: "label" }],
        publicProps: { title: { node: "label-text", prop: "content" } },
      },
    },
  });

  const errors = DesignDocument.validate(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "dangling-binding-node",
      nodeName: "button",
      prop: "title",
    }),
  ]);
});

test("複数の binding の不整合がすべて報告される", () => {
  const document = DesignDocument.create({
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: {
          label: { node: "no-such-node", prop: "content" },
          textAlign: { node: "button-label", prop: "no-such-prop" },
        },
      },
    },
  });

  const errors = DesignDocument.validate(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "dangling-binding-node",
      prop: "label",
    }),
    expect.objectContaining({
      kind: "dangling-binding-prop",
      prop: "textAlign",
    }),
  ]);
});

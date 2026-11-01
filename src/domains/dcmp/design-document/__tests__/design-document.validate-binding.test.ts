import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "../index";

test("存在しない内部ノード名への binding は dangling-binding-node エラーになる", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { label: { node: "no-such-node", prop: "content" } },
      },
    },
  });

  const errors = DesignDocument.collectErrors(document);

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
    tokens: DocumentTemplate.Default.tokens,
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { label: { node: "button-label", prop: "no-such-prop" } },
      },
    },
  });

  const errors = DesignDocument.collectErrors(document);

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
    tokens: DocumentTemplate.Default.tokens,
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { spacing: { node: "button-label", prop: "gap" } },
      },
    },
  });

  const errors = DesignDocument.collectErrors(document);

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
    tokens: DocumentTemplate.Default.tokens,
    components: {
      label: {
        type: "Text",
        publicProps: { text: { node: "label", prop: "content" } },
      },
    },
  });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("内部ノードへの binding は有効になる", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { label: { node: "button-label", prop: "content" } },
      },
    },
  });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("ネストした部品が公開する publicProps への binding は有効になる", () => {
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
  });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("ネストした部品が公開していない prop への binding は dangling-binding-prop エラーになる", () => {
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
        publicProps: { title: { node: "button-label", prop: "content" } },
      },
    },
  });

  const errors = DesignDocument.collectErrors(document);

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
    tokens: DocumentTemplate.Default.tokens,
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

  const errors = DesignDocument.collectErrors(document);

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
    tokens: DocumentTemplate.Default.tokens,
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

  const errors = DesignDocument.collectErrors(document);

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

test("locking への binding は unbindable-binding-prop エラーになる", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { frozen: { node: "button-label", prop: "locking" } },
      },
    },
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "unbindable-binding-prop",
      nodeName: "button",
      prop: "frozen",
    }),
  ]);
});

test("入れ子の部品の locking へ繋いだ公開 prop を親が辿っていても、エラーは繋いだ部品に 1 件だけ出る", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { frozen: { node: "button-label", prop: "locking" } },
      },
      card: {
        type: "Box",
        children: [{ name: "card-action", ref: "button" }],
        publicProps: { actionFrozen: { node: "card-action", prop: "frozen" } },
      },
    },
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "unbindable-binding-prop",
      nodeName: "button",
      prop: "frozen",
    }),
  ]);
});

test("locking という名前の公開 prop を他の prop へ繋いでもエラーにならない", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      badge: {
        type: "Box",
        children: [{ name: "badge-label", type: "Text" }],
        publicProps: { locking: { node: "badge-label", prop: "content" } },
      },
    },
  });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("インスタンスが語彙に無い値で locking へ繋いだ公開 prop を上書きしていても、エラーは binding の 1 件だけ", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { frozen: { node: "button-label", prop: "locking" } },
      },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          {
            name: "screen-button",
            ref: "button",
            overrides: { frozen: "frozen" },
          },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "unbindable-binding-prop",
      nodeName: "button",
      prop: "frozen",
    }),
  ]);
});

import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "../index";

test("数字だけの publicProps 宣言名は invalid-public-prop-name エラーになる", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { "1": { node: "button-label", prop: "content" } },
      },
    },
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "invalid-public-prop-name",
      nodeName: "button",
      prop: "1",
    }),
  ]);
});

test("先頭に 0 のある数字だけの publicProps 宣言名も invalid-public-prop-name エラーになる", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { "007": { node: "button-label", prop: "content" } },
      },
    },
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "invalid-public-prop-name",
      nodeName: "button",
      prop: "007",
    }),
  ]);
});

test("数字を含むが数字だけではない publicProps 宣言名はエラーにならない", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { "label-2": { node: "button-label", prop: "content" } },
      },
    },
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([]);
});

test("camelCase の publicProps 宣言名はエラーにならない", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: {
          actionLabel: { node: "button-label", prop: "content" },
        },
      },
    },
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([]);
});

test("数字だけの publicProps 宣言名の binding が壊れていると、宣言名と binding の両方のエラーが出る", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { "1": { node: "no-such-node", prop: "content" } },
      },
    },
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "invalid-public-prop-name", prop: "1" }),
    expect.objectContaining({ kind: "dangling-binding-node", prop: "1" }),
  ]);
});

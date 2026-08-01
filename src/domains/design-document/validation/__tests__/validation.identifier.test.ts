import { expect, test } from "vitest";
import { DesignDocument } from "../../index";

test("大文字を含むノード名は invalid-identifier エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "LoginForm", type: "Box" }],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "invalid-identifier",
      nodeName: "LoginForm",
    }),
  ]);
});

test("アンダースコアを含むノード名は invalid-identifier エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "login_form", type: "Box" }],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "invalid-identifier",
      nodeName: "login_form",
    }),
  ]);
});

test("予約文字 / を含むノード名は invalid-identifier エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "shared/button", type: "Box" }],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "invalid-identifier",
      nodeName: "shared/button",
    }),
  ]);
});

test("予約文字 # を含むノード名は invalid-identifier エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "form#1", type: "Box" }],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "invalid-identifier",
      nodeName: "form#1",
    }),
  ]);
});

test("予約文字 . を含むノード名は invalid-identifier エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "form.title", type: "Box" }],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "invalid-identifier",
      nodeName: "form.title",
    }),
  ]);
});

test("部品名が識別子規則に違反していると invalid-identifier エラーになる", () => {
  const document = DesignDocument.create({
    components: { PrimaryButton: { type: "Box" } },
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "invalid-identifier",
      nodeName: "PrimaryButton",
    }),
  ]);
});

test("artboard 名が識別子規則に違反していると invalid-identifier エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      { name: "Login Screen", width: 375, height: 812, children: [] },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "invalid-identifier",
      nodeName: "Login Screen",
    }),
  ]);
});

test("部品内部のノード名も識別子規則で検証される", () => {
  const document = DesignDocument.create({
    components: {
      card: { type: "Box", children: [{ name: "Label", type: "Text" }] },
    },
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "invalid-identifier", nodeName: "Label" }),
  ]);
});

test("トークン名が識別子規則に違反していると invalid-identifier エラーになる", () => {
  const document = DesignDocument.create({
    tokens: {
      colors: { Primary: "#112233" },
      spacing: {},
      radius: {},
      shadows: {},
      typography: {},
    },
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "invalid-identifier",
      nodeName: "Primary",
    }),
  ]);
});

test("kebab-case の名前とトークン名だけのドキュメントはエラーにならない", () => {
  const document = DesignDocument.create({
    tokens: {
      colors: { "brand-primary": "#112233" },
      spacing: { md: 8 },
      radius: {},
      shadows: {},
      typography: {},
    },
    components: {
      "primary-button": {
        type: "Box",
        children: [{ name: "label", type: "Text" }],
      },
    },
    artboards: [
      {
        name: "login-screen",
        width: 375,
        height: 812,
        children: [{ name: "login-form-2", type: "Box" }],
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("識別子規則に違反する名前が重複していると規則違反と重複の両方が報告される", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "Label", type: "Text" },
          { name: "Label", type: "Text" },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors.map((error) => error.kind)).toEqual([
    "invalid-identifier",
    "invalid-identifier",
    "duplicate-name",
  ]);
});

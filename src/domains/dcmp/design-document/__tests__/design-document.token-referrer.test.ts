import { expect, test } from "vitest";
import { TokenSet } from "@/domains/dcmp/token";
import { DesignDocument, TokenReferrer } from "../index";

const Gray900 = { kind: "colors", name: "gray-900" } as const;

test("ノードの prop がトークンを指していると、そのノードと prop が参照元になる", () => {
  const document = DesignDocument.create({
    tokens: {
      ...TokenSet.empty(),
      colors: { "gray-900": "#111827", "gray-500": "#6b7280" },
    },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text", props: { color: "gray-900" } },
          { name: "caption", type: "Text", props: { color: "gray-500" } },
        ],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, Gray900);

  expect(referrers.map(TokenReferrer.toText)).toEqual(["title.color"]);
});

test("artboard の props がトークンを指していると artboard も参照元になる", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { "gray-900": "#111827" } },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        props: { background: "gray-900" },
        children: [],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, Gray900);

  expect(referrers).toEqual([
    { target: "artboard", name: "login", prop: "background" },
  ]);
});

test("1つのノードが2つの prop から同じトークンを指すと prop ごとに参照元が並ぶ", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), spacing: { md: 16 } },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          {
            name: "login-form",
            type: "Box",
            props: {
              paddingTop: "md",
              paddingRight: "md",
              paddingBottom: "md",
              paddingLeft: "md",
            },
            children: [],
          },
        ],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, {
    kind: "spacing",
    name: "md",
  });

  expect(referrers.map(TokenReferrer.toText)).toEqual([
    "login-form.paddingTop",
    "login-form.paddingRight",
    "login-form.paddingBottom",
    "login-form.paddingLeft",
  ]);
});

test("入れ子の奥にあるノードからも参照元が集まる", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { "gray-900": "#111827" } },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          {
            name: "login-form",
            type: "Box",
            children: [
              {
                name: "login-field",
                type: "Box",
                children: [
                  {
                    name: "login-label",
                    type: "Text",
                    props: { color: "gray-900" },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, Gray900);

  expect(referrers.map(TokenReferrer.toText)).toEqual(["login-label.color"]);
});

test("インスタンスの上書きがトークンを指すと、そのインスタンスと公開 prop が参照元になる", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { "gray-900": "#111827" } },
    components: {
      badge: {
        type: "Box",
        publicProps: { tone: { node: "badge-body", prop: "background" } },
        children: [{ name: "badge-body", type: "Box", children: [] }],
      },
    },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          {
            name: "login-badge",
            ref: "badge",
            overrides: { tone: "gray-900" },
          },
        ],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, Gray900);

  expect(referrers).toEqual([
    { target: "instance", name: "login-badge", prop: "tone" },
  ]);
});

test("部品定義の props がトークンを指すと、部品名が参照元になる", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { "gray-900": "#111827" } },
    components: {
      "primary-button": { type: "Box", props: { background: "gray-900" } },
    },
    artboards: [],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, Gray900);

  expect(referrers).toEqual([
    { target: "component", name: "primary-button", prop: "background" },
  ]);
});

test("部品定義の中のノードがトークンを指すと、そのノードが参照元になる", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { "gray-900": "#111827" } },
    components: {
      "primary-button": {
        type: "Box",
        children: [
          {
            name: "primary-button-label",
            type: "Text",
            props: { color: "gray-900" },
          },
        ],
      },
    },
    artboards: [],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, Gray900);

  expect(referrers).toEqual([
    {
      target: "primitive",
      name: "primary-button-label",
      type: "Text",
      prop: "color",
    },
  ]);
});

test("参照元はキャンバス上のものが先、部品定義の中のものが後に並ぶ", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { "gray-900": "#111827" } },
    components: {
      "primary-button": { type: "Box", props: { background: "gray-900" } },
    },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text", props: { color: "gray-900" } },
        ],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, Gray900);

  expect(referrers.map(TokenReferrer.toText)).toEqual([
    "title.color",
    "primary-button.background",
  ]);
});

test("キャンバス上の参照元は artboard の並び順で並ぶ", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { "gray-900": "#111827" } },
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [
          { name: "home-title", type: "Text", props: { color: "gray-900" } },
        ],
      },
      {
        name: "settings",
        width: 375,
        height: 812,
        children: [
          {
            name: "settings-title",
            type: "Text",
            props: { color: "gray-900" },
          },
        ],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, Gray900);

  expect(referrers.map(TokenReferrer.toText)).toEqual([
    "home-title.color",
    "settings-title.color",
  ]);
});

test("1つのノードが2つの prop から同じトークンを指しても、ノード名は1つだけになる", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), spacing: { md: 16 } },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          {
            name: "login-form",
            type: "Box",
            props: {
              paddingTop: "md",
              paddingRight: "md",
              paddingBottom: "md",
              paddingLeft: "md",
            },
            children: [],
          },
        ],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, {
    kind: "spacing",
    name: "md",
  });

  expect(TokenReferrer.nodeNames(referrers)).toEqual(["login-form"]);
});

test("artboard 自身がトークンを指していても、ノード名としては並ばない", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { "gray-900": "#111827" } },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        props: { background: "gray-900" },
        children: [
          { name: "title", type: "Text", props: { color: "gray-900" } },
        ],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, Gray900);

  expect(TokenReferrer.nodeNames(referrers)).toEqual(["title"]);
});

test("部品定義のルートがトークンを指していても、ノード名としては並ばない", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { "gray-900": "#111827" } },
    components: {
      "primary-button": { type: "Box", props: { background: "gray-900" } },
    },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text", props: { color: "gray-900" } },
        ],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, Gray900);

  expect(TokenReferrer.nodeNames(referrers)).toEqual(["title"]);
});

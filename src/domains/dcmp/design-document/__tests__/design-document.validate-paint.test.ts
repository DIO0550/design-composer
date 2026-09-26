import { expect, test } from "vitest";
import { Fade } from "@/domains/__tests__/gradient-tokens";
import { TokenSet } from "@/domains/dcmp/token";
import { DesignDocument } from "../index";

test("colors と gradients に同じ名前があると、参照されていなくても conflicting-token-name エラーになる", () => {
  const document = DesignDocument.create({
    tokens: {
      ...TokenSet.empty(),
      colors: { brand: "#3b82f6" },
      gradients: { brand: Fade },
    },
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "conflicting-token-name",
      nodeName: "brand",
    }),
  ]);
});

test("colors と spacing に同じ名前があってもエラーにならない", () => {
  const document = DesignDocument.create({
    tokens: {
      ...TokenSet.empty(),
      colors: { brand: "#3b82f6" },
      spacing: { brand: 8 },
    },
  });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("background が gradients のトークンの名前を指していても dangling-token にならない", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), gradients: { fade: Fade } },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "hero", type: "Box", props: { background: "fade" } },
        ],
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("background が colors にも gradients にも無い名前を指すと dangling-token エラーになる", () => {
  const document = DesignDocument.create({
    tokens: {
      ...TokenSet.empty(),
      colors: { primary: "#3b82f6" },
      gradients: { fade: Fade },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "hero", type: "Box", props: { background: "nope" } },
        ],
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "dangling-token",
      nodeName: "hero",
      prop: "background",
    }),
  ]);
});

test("Text の color が gradients のトークンの名前を指すと dangling-token エラーになる", () => {
  const document = DesignDocument.create({
    tokens: {
      ...TokenSet.empty(),
      colors: { "gray-900": "#111827" },
      typography: {
        body: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 },
      },
      gradients: { fade: Fade },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "title", type: "Text", props: { color: "fade" } }],
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "dangling-token",
      nodeName: "title",
      prop: "color",
    }),
  ]);
});

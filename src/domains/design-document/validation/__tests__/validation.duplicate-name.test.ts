import { expect, test } from "vitest";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../../index";

test("同じ artboard 内に同名のノードが2つあると duplicate-name エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "label", type: "Text" },
          { name: "label", type: "Text" },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "duplicate-name", nodeName: "label" }),
  ]);
});

test("別の artboard 配下であっても同名のノードは duplicate-name エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "first-screen",
        width: 375,
        height: 812,
        children: [{ name: "label", type: "Text" }],
      },
      {
        name: "second-screen",
        width: 375,
        height: 812,
        children: [{ name: "label", type: "Text" }],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "duplicate-name", nodeName: "label" }),
  ]);
});

test("部品名とノード名が同じだと duplicate-name エラーになる", () => {
  const document = DesignDocument.create({
    components: { card: { type: "Box" } },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "card", type: "Box" }],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "duplicate-name", nodeName: "card" }),
  ]);
});

test("artboard 名とノード名が同じだと duplicate-name エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "screen", type: "Box" }],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "duplicate-name", nodeName: "screen" }),
  ]);
});

test("部品内部のノード名と artboard 配下のノード名が同じだと duplicate-name エラーになる", () => {
  const document = DesignDocument.create({
    components: {
      card: { type: "Box", children: [{ name: "label", type: "Text" }] },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "label", type: "Text" }],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "duplicate-name", nodeName: "label" }),
  ]);
});

test("入れ子の深さが違っても同名のノードは duplicate-name エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "label", type: "Text" },
          {
            name: "box-1",
            type: "Box",
            children: [{ name: "label", type: "Text" }],
          },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "duplicate-name", nodeName: "label" }),
  ]);
});

test("同じ名前が3回現れても duplicate-name エラーは1件だけ報告される", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "label", type: "Text" },
          { name: "label", type: "Text" },
          { name: "label", type: "Text" },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "duplicate-name", nodeName: "label" }),
  ]);
});

test("種別の違うトークンに同名があってもエラーにならない", () => {
  const document = DesignDocument.create({
    tokens: {
      colors: { md: "#112233" },
      spacing: { md: 8 },
      radius: { md: 4 },
      shadows: {},
      typography: {},
    },
  });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("トークン名とノード名が同じでもエラーにならない", () => {
  const document = DesignDocument.create({
    tokens: {
      colors: { label: "#112233" },
      spacing: {},
      radius: {},
      shadows: {},
      typography: {},
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "label", type: "Text" }],
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("部品化したサブツリーの内部ノード名も使用中の名前に含まれる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          {
            name: "box-1",
            type: "Box",
            children: [{ name: "label", type: "Text" }],
          },
        ],
      },
    ],
  });

  const componentized = Result.unwrap(
    DesignDocument.createComponent(document, "box-1", "card"),
  );

  expect(DesignDocument.usedNames(componentized).has("label")).toBe(true);
});

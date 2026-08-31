import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentJson } from "../index";

test("トップレベルのフィールドは仕様の定義順で書き出される", () => {
  const document = DesignDocument.create({});

  const text = DocumentJson.serialize(document);

  expect(text).toBe(`{
  "formatVersion": "1.2",
  "tokens": {},
  "components": {},
  "artboards": []
}
`);
});

test("トークンは名前の昇順で書き出される", () => {
  const document = DesignDocument.create({
    tokens: {
      colors: {},
      spacing: { md: 16, xs: 4, lg: 24 },
      radius: {},
      shadows: {},
      typography: {},
    },
  });

  const text = DocumentJson.serialize(document);

  expect(text).toContain(`"spacing": {
      "lg": 24,
      "md": 16,
      "xs": 4
    }`);
});

test("トークンを1つも持たない種別は書き出されない", () => {
  const document = DesignDocument.create({
    tokens: {
      colors: { primary: "#3b82f6" },
      spacing: {},
      radius: {},
      shadows: {},
      typography: {},
    },
  });

  const text = DocumentJson.serialize(document);

  expect(JSON.parse(text).tokens).toEqual({ colors: { primary: "#3b82f6" } });
});

test("色は小文字の hex に正規化されて書き出される", () => {
  const document = DesignDocument.create({
    tokens: {
      colors: { primary: "#3B82F6" },
      spacing: {},
      radius: {},
      shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0000001A" } },
      typography: {},
    },
  });

  const text = DocumentJson.serialize(document);

  expect(JSON.parse(text).tokens).toEqual({
    colors: { primary: "#3b82f6" },
    shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0000001a" } },
  });
});

test("設定されていない任意フィールドは書き出されない", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 100,
        height: 200,
        children: [{ name: "box", type: "Box" }],
      },
    ],
  });

  const text = DocumentJson.serialize(document);

  expect(JSON.parse(text).artboards).toEqual([
    {
      name: "screen",
      width: 100,
      height: 200,
      children: [{ name: "box", type: "Box" }],
    },
  ]);
});

test("空の props と空の children は書き出されない", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 100,
        height: 200,
        props: {},
        children: [{ name: "box", type: "Box", props: {}, children: [] }],
      },
    ],
  });

  const text = DocumentJson.serialize(document);

  expect(JSON.parse(text).artboards[0]).toEqual({
    name: "screen",
    width: 100,
    height: 200,
    children: [{ name: "box", type: "Box" }],
  });
});

test("artboard の children は空でも必須フィールドとして書き出される", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 100, height: 200, children: [] }],
  });

  const text = DocumentJson.serialize(document);

  expect(JSON.parse(text).artboards[0]).toEqual({
    name: "screen",
    width: 100,
    height: 200,
    children: [],
  });
});

test("部品は publicProps・type・props・children の順で書き出される", () => {
  const document = DesignDocument.create({
    components: {
      card: {
        type: "Box",
        props: { radius: "md" },
        children: [{ name: "card-title", type: "Text" }],
        publicProps: { title: { node: "card-title", prop: "content" } },
      },
    },
  });

  const text = DocumentJson.serialize(document);

  expect(Object.keys(JSON.parse(text).components.card)).toEqual([
    "publicProps",
    "type",
    "props",
    "children",
  ]);
});

test("参照ノードは name・ref・overrides の順で書き出される", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 100,
        height: 200,
        children: [
          {
            name: "submit",
            ref: "primary-button",
            overrides: { label: "保存" },
          },
        ],
      },
    ],
  });

  const text = DocumentJson.serialize(document);

  expect(Object.keys(JSON.parse(text).artboards[0].children[0])).toEqual([
    "name",
    "ref",
    "overrides",
  ]);
});

test("props は名前の昇順で書き出される", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 100,
        height: 200,
        props: { gap: "md", background: "primary", direction: "row" },
        children: [],
      },
    ],
  });

  const text = DocumentJson.serialize(document);

  expect(Object.keys(JSON.parse(text).artboards[0].props)).toEqual([
    "background",
    "direction",
    "gap",
  ]);
});

test("同じ値のドキュメントは props を設定した順序が違っても同じテキストになる", () => {
  const first = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 100,
        height: 200,
        props: { direction: "row", gap: "md" },
        children: [],
      },
    ],
  });
  const second = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 100,
        height: 200,
        props: { gap: "md", direction: "row" },
        children: [],
      },
    ],
  });

  expect(DocumentJson.serialize(first)).toBe(DocumentJson.serialize(second));
});

test("書き出したテキストは2スペースインデントで末尾に改行が付く", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 100, height: 200, children: [] }],
  });

  const text = DocumentJson.serialize(document);

  expect(text).toContain('\n  "artboards": [');
  expect(text.endsWith("]\n}\n")).toBe(true);
});

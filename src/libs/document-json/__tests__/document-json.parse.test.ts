import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { Result } from "@/utils/Result";
import { DocumentJson } from "../index";

/** docs/01-file-format.md「ドキュメント全体の例」に沿った最小のドキュメント。 */
function setupText(): string {
  return `{
  "formatVersion": "1.0",
  "tokens": {
    "colors": { "primary": "#3b82f6", "white": "#ffffff" },
    "spacing": { "md": 16 },
    "radius": { "md": 8 },
    "shadows": { "sm": { "x": 0, "y": 1, "blur": 3, "color": "#0000001a" } },
    "typography": { "body": { "fontSize": 16, "lineHeight": 1.6, "fontWeight": 400 } }
  },
  "components": {
    "primary-button": {
      "publicProps": { "label": { "node": "primary-button-label", "prop": "content" } },
      "type": "Box",
      "props": { "background": "primary", "radius": "md" },
      "children": [
        { "name": "primary-button-label", "type": "Text", "props": { "content": "Button", "color": "white" } }
      ]
    }
  },
  "artboards": [
    {
      "name": "login-screen",
      "width": 375,
      "height": 812,
      "props": { "direction": "column", "gap": "md" },
      "children": [
        { "name": "login-submit", "ref": "primary-button", "overrides": { "label": "ログイン" } }
      ]
    }
  ]
}`;
}

test("ドキュメント全体を読み込むと仕様どおりのドメインオブジェクトになる", () => {
  const document = Result.unwrap(DocumentJson.parse(setupText()));

  expect(document).toEqual({
    formatVersion: { major: 1, minor: 0 },
    tokens: {
      colors: { primary: "#3b82f6", white: "#ffffff" },
      spacing: { md: 16 },
      radius: { md: 8 },
      shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0000001a" } },
      typography: { body: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 } },
    },
    components: {
      "primary-button": {
        type: "Box",
        props: { background: "primary", radius: "md" },
        children: [
          {
            name: "primary-button-label",
            type: "Text",
            props: { content: "Button", color: "white" },
          },
        ],
        publicProps: {
          label: { node: "primary-button-label", prop: "content" },
        },
      },
    },
    artboards: [
      {
        name: "login-screen",
        width: 375,
        height: 812,
        props: { direction: "column", gap: "md" },
        children: [
          {
            name: "login-submit",
            ref: "primary-button",
            overrides: { label: "ログイン" },
          },
        ],
      },
    ],
  });
});

test("読み込んだドキュメントはそのままバリデーションを通せる", () => {
  const document = Result.unwrap(DocumentJson.parse(setupText()));

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("アプリと同じ形式のファイルはそのまま読み込める", () => {
  const text = `{ "formatVersion": "1.0", "tokens": {}, "components": {}, "artboards": [] }`;

  const document = Result.unwrap(DocumentJson.parse(text));

  expect(document.formatVersion).toEqual({ major: 1, minor: 0 });
});

test("大文字で書かれた色は小文字の hex に正規化される", () => {
  const text = `{ "formatVersion": "1.0", "tokens": { "colors": { "primary": "#3B82F6" } }, "components": {}, "artboards": [] }`;

  const document = Result.unwrap(DocumentJson.parse(text));

  expect(document.tokens.colors.primary).toBe("#3b82f6");
});

test("shadows の色も小文字の hex に正規化される", () => {
  const text = `{ "formatVersion": "1.0", "tokens": { "shadows": { "sm": { "x": 0, "y": 1, "blur": 3, "color": "#0000001A" } } }, "components": {}, "artboards": [] }`;

  const document = Result.unwrap(DocumentJson.parse(text));

  expect(document.tokens.shadows.sm.color).toBe("#0000001a");
});

test("トークンを1つも持たない種別は空として読み込まれる", () => {
  const text = `{ "formatVersion": "1.0", "tokens": { "spacing": { "md": 16 } }, "components": {}, "artboards": [] }`;

  const document = Result.unwrap(DocumentJson.parse(text));

  expect(document.tokens).toEqual({
    colors: {},
    spacing: { md: 16 },
    radius: {},
    shadows: {},
    typography: {},
  });
});

test("省略された shadows の spread はドキュメントにも現れない", () => {
  const text = `{ "formatVersion": "1.0", "tokens": { "shadows": { "sm": { "x": 0, "y": 1, "blur": 3, "color": "#000000" } } }, "components": {}, "artboards": [] }`;

  const document = Result.unwrap(DocumentJson.parse(text));

  expect(Object.keys(document.tokens.shadows.sm)).toEqual([
    "x",
    "y",
    "blur",
    "color",
  ]);
});

test("省略された typography の fontFamily はドキュメントにも現れない", () => {
  const text = `{ "formatVersion": "1.0", "tokens": { "typography": { "body": { "fontSize": 16, "lineHeight": 1.6, "fontWeight": 400 } } }, "components": {}, "artboards": [] }`;

  const document = Result.unwrap(DocumentJson.parse(text));

  expect(Object.keys(document.tokens.typography.body)).toEqual([
    "fontSize",
    "lineHeight",
    "fontWeight",
  ]);
});

test("props も children も持たないノードを読み込める", () => {
  const text = `{ "formatVersion": "1.0", "tokens": {}, "components": {}, "artboards": [ { "name": "screen", "width": 100, "height": 200, "children": [ { "name": "box", "type": "Box" } ] } ] }`;

  const document = Result.unwrap(DocumentJson.parse(text));

  expect(document.artboards[0]?.children[0]).toEqual({
    name: "box",
    type: "Box",
  });
});

test("入れ子になったノードは階層のまま読み込まれる", () => {
  const text = `{ "formatVersion": "1.0", "tokens": {}, "components": {}, "artboards": [ { "name": "screen", "width": 100, "height": 200, "children": [ { "name": "outer", "type": "Box", "children": [ { "name": "inner", "type": "Text", "props": { "content": "hello" } } ] } ] } ] }`;

  const document = Result.unwrap(DocumentJson.parse(text));

  expect(document.artboards[0]?.children[0]).toEqual({
    name: "outer",
    type: "Box",
    children: [{ name: "inner", type: "Text", props: { content: "hello" } }],
  });
});

test("末尾に改行のあるテキストも読み込める", () => {
  const text = `{ "formatVersion": "1.0", "tokens": {}, "components": {}, "artboards": [] }\n`;

  const document = Result.unwrap(DocumentJson.parse(text));

  expect(document.artboards).toEqual([]);
});

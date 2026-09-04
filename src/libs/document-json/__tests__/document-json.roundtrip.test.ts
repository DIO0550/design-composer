import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Result } from "@/utils/Result";
import { DocumentJson } from "../index";

function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: {
      colors: { primary: "#3b82f6", white: "#ffffff" },
      spacing: { md: 16, sm: 8 },
      radius: { md: 8 },
      shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0000001a" } },
      typography: {
        body: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 },
        heading: {
          fontSize: 24,
          lineHeight: 1.4,
          fontWeight: 700,
          fontFamily: "Inter",
        },
      },
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
            name: "login-form",
            type: "Box",
            props: { gap: "sm" },
            children: [
              {
                name: "login-submit",
                ref: "primary-button",
                overrides: { label: "ログイン" },
              },
            ],
          },
        ],
      },
    ],
  });
}

test("書き出したテキストを読み直すと元のドキュメントと同じ意味になる", () => {
  const document = setupDocument();

  const reloaded = Result.unwrap(
    DocumentJson.parse(DocumentJson.serialize(document)),
  );

  expect(reloaded).toEqual(document);
});

test("読み込んで書き出しても同じテキストに戻る", () => {
  const text = DocumentJson.serialize(setupDocument());

  const rewritten = DocumentJson.serialize(
    Result.unwrap(DocumentJson.parse(text)),
  );

  expect(rewritten).toBe(text);
});

test("キャンバス上の位置を持つ artboard は、書き出して読み直しても位置が変わらない", () => {
  const text = `{
  "formatVersion": "1.3",
  "tokens": {},
  "components": {},
  "artboards": [
    {
      "name": "screen",
      "width": 100,
      "height": 200,
      "x": 900,
      "y": 300,
      "children": []
    }
  ]
}
`;

  const rewritten = DocumentJson.serialize(
    Result.unwrap(DocumentJson.parse(text)),
  );

  expect(rewritten).toBe(text);
});

test("整形が崩れたテキストを読み込んで書き出すと正規形になる", () => {
  const messy = `{"artboards":[{"children":[],"height":200,"name":"screen","width":100}],"components":{},"formatVersion":"1.0","tokens":{"colors":{"primary":"#3B82F6"}}}`;

  const normalized = DocumentJson.serialize(
    Result.unwrap(DocumentJson.parse(messy)),
  );

  expect(normalized).toBe(`{
  "formatVersion": "1.3",
  "tokens": {
    "colors": {
      "primary": "#3b82f6"
    }
  },
  "components": {},
  "artboards": [
    {
      "name": "screen",
      "width": 100,
      "height": 200,
      "children": []
    }
  ]
}
`);
});

test("読み書きを繰り返してもドキュメントの意味は変わらない", () => {
  const document = setupDocument();

  const once = Result.unwrap(
    DocumentJson.parse(DocumentJson.serialize(document)),
  );
  const twice = Result.unwrap(DocumentJson.parse(DocumentJson.serialize(once)));

  expect(twice).toEqual(document);
});

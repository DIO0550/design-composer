import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Result } from "@/utils/Result";
import { DocumentHtml } from "../index";

test("artboard が1つも無いドキュメントはルート要素だけの HTML になる", () => {
  const document = DesignDocument.create({});

  const html = Result.unwrap(DocumentHtml.toHtml(document));

  expect(html).toBe('<div style=""></div>');
});

test("トークンが空でも artboard はコンパイルされる", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 100, height: 200, children: [] }],
  });

  const compiled = Result.unwrap(DocumentHtml.compile(document));

  expect(compiled.variables).toEqual({});
  expect(compiled.artboards).toHaveLength(1);
});

test("存在しない部品を参照しているとコンパイルできない", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 100,
        height: 200,
        children: [{ name: "instance", ref: "no-such-component" }],
      },
    ],
  });

  const result = DocumentHtml.compile(document);

  expect(result.ok).toBe(false);
});

test("未知の type のノードがあるとコンパイルできない", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 100,
        height: 200,
        children: [{ name: "mystery", type: "Image" }],
      },
    ],
  });

  const result = DocumentHtml.compile(document);

  expect(result.ok).toBe(false);
});

test("後ろの artboard にエラーがあるとドキュメント全体がコンパイルできない", () => {
  const document = DesignDocument.create({
    artboards: [
      { name: "first", width: 100, height: 100, children: [] },
      {
        name: "second",
        width: 100,
        height: 100,
        children: [{ name: "mystery", type: "Image" }],
      },
    ],
  });

  const result = DocumentHtml.compile(document);

  expect(result.ok).toBe(false);
});

test("同じドキュメントからは常に同じ HTML が得られる", () => {
  const document = DesignDocument.create({
    tokens: {
      colors: { primary: "#3b82f6" },
      spacing: { md: 16 },
      radius: {},
      shadows: {},
      typography: {},
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        props: { background: "primary", gap: "md" },
        children: [{ name: "title", type: "Text" }],
      },
    ],
  });

  expect(Result.unwrap(DocumentHtml.toHtml(document))).toBe(
    Result.unwrap(DocumentHtml.toHtml(document)),
  );
});

test("Text の内容がそのままマークアップとして解釈されることはない", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 100,
        height: 100,
        children: [
          {
            name: "title",
            type: "Text",
            props: { content: "<img src=x onerror=alert(1)>" },
          },
        ],
      },
    ],
  });

  const html = Result.unwrap(DocumentHtml.toHtml(document));

  expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
});

import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "../index";

test("すべての props がスキーマに適合するドキュメントはエラーを返さない", () => {
  const document = DesignDocument.create({
    tokens: {
      colors: { "gray-900": "#111111" },
      spacing: { md: 16 },
      radius: {},
      shadows: {},
      typography: {
        body: { fontSize: 14, lineHeight: 20, fontWeight: 400 },
      },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          {
            name: "box-1",
            type: "Box",
            props: { direction: "row", gap: "md", background: "gray-900" },
            children: [
              {
                name: "label",
                type: "Text",
                props: { content: "hello", typography: "body" },
              },
            ],
          },
        ],
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("props を指定しないノードは、デフォルトが指すトークンが揃っていればエラーにならない", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
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

test("ref ノードはプリミティブとしてのスキーマ検証を受けない", () => {
  const document = DesignDocument.create({
    components: { button: { type: "Box" } },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "instance", ref: "button" }],
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("複数の違反がある場合、最初の1件で止まらず全件報告される", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "box-1", type: "Box", props: { direction: "diagonal" } },
          { name: "label-1", type: "Text", props: { content: 42 } },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toHaveLength(2);
  expect(errors.map((error) => error.nodeName)).toEqual(["box-1", "label-1"]);
});

import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "../index";

test("配置と座標を書いたノードはエラーにならない", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          {
            name: "badge",
            type: "Text",
            props: { placement: "absolute", x: 40, y: 24 },
          },
        ],
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("座標に文字列を書くと literal-type-mismatch エラーになる", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          {
            name: "badge",
            type: "Text",
            props: { placement: "absolute", x: "40", y: 24 },
          },
        ],
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "literal-type-mismatch",
      nodeName: "badge",
      prop: "x",
    }),
  ]);
});

test("知らない配置のモードを書くと enum-violation エラーになる", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "badge", type: "Text", props: { placement: "sticky" } },
        ],
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "enum-violation",
      nodeName: "badge",
      prop: "placement",
    }),
  ]);
});

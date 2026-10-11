import { expect, test } from "vitest";
import type { Node, Props } from "@/domains/dcmp/node";
import type { TokenSet } from "@/domains/dcmp/token";
import { DesignDocument, DocumentTemplate } from "../index";

/**
 * artboard を 1 つだけ持つドキュメント。
 *
 * @param artboard その artboard に設定する props と子の並び。`tokens` を渡せばドキュメントの
 *   トークンにする
 * @returns その artboard を持つドキュメント
 */
function documentWithArtboard(
  artboard: Readonly<{
    props: Props;
    children: readonly Node[];
    tokens?: TokenSet;
  }>,
): DesignDocument {
  return DesignDocument.create({
    ...(artboard.tokens !== undefined ? { tokens: artboard.tokens } : {}),
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        props: artboard.props,
        children: artboard.children,
      },
    ],
  });
}

/**
 * 子を縦に並べる artboard の直下に Box を 1 つ持つドキュメント。
 *
 * @param props その Box に設定する props
 * @returns その Box を持つドキュメント
 */
function documentWithBox(props: Props): DesignDocument {
  return documentWithArtboard({
    props: { layout: "column" },
    children: [{ name: "target", type: "Box", props }],
  });
}

test("Box の最小幅が最大幅より大きいと、maxWidth を指すエラーが 1 件出る", () => {
  const document = documentWithBox({
    widthMode: "hug",
    minWidth: 500,
    maxWidth: 100,
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "inverted-size-limits",
      nodeName: "target",
      prop: "maxWidth",
    }),
  ]);
});

test("Box の最小高さが最大高さより大きいと、maxHeight を指すエラーが出る", () => {
  const document = documentWithBox({
    heightMode: "hug",
    minHeight: 500,
    maxHeight: 100,
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "inverted-size-limits",
      nodeName: "target",
      prop: "maxHeight",
    }),
  ]);
});

test("両軸とも逆転していると、軸ごとに 1 件ずつ出る", () => {
  const document = documentWithBox({
    widthMode: "hug",
    minWidth: 500,
    maxWidth: 100,
    heightMode: "fill",
    minHeight: 500,
    maxHeight: 100,
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "inverted-size-limits",
      nodeName: "target",
      prop: "maxWidth",
    }),
    expect.objectContaining({
      kind: "inverted-size-limits",
      nodeName: "target",
      prop: "maxHeight",
    }),
  ]);
});

test("widthMode を書いていない Box でも、既定の hug として逆転を検出する", () => {
  const document = documentWithBox({ minWidth: 500, maxWidth: 100 });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "inverted-size-limits",
      nodeName: "target",
      prop: "maxWidth",
    }),
  ]);
});

test("fixed の軸に書いた逆転はエラーにならない", () => {
  const document = documentWithArtboard({
    props: { layout: "column" },
    children: [
      {
        name: "fixed-box",
        type: "Box",
        props: {
          widthMode: "fixed",
          width: 120,
          minWidth: 500,
          maxWidth: 100,
        },
      },
      {
        name: "hug-box",
        type: "Box",
        props: { widthMode: "hug", minWidth: 500, maxWidth: 100 },
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "inverted-size-limits",
      nodeName: "hug-box",
      prop: "maxWidth",
    }),
  ]);
});

test("最小と最大が等しいときはエラーにならない", () => {
  const document = documentWithBox({
    widthMode: "hug",
    minWidth: 100,
    maxWidth: 100,
  });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("部品のルート自身の逆転を検出する", () => {
  const document = DesignDocument.create({
    components: {
      card: { type: "Box", props: { minWidth: 500, maxWidth: 100 } },
    },
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "inverted-size-limits",
      nodeName: "card",
      prop: "maxWidth",
    }),
  ]);
});

test("部品の子孫の逆転を検出する", () => {
  const document = DesignDocument.create({
    components: {
      card: {
        type: "Box",
        children: [
          {
            name: "target",
            type: "Box",
            props: { minWidth: 500, maxWidth: 100 },
          },
        ],
      },
    },
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "inverted-size-limits",
      nodeName: "target",
      prop: "maxWidth",
    }),
  ]);
});

test("部品のルートの逆転は、その部品の子孫のエラーより前に並ぶ", () => {
  const document = DesignDocument.create({
    components: {
      card: {
        type: "Box",
        props: { minWidth: 500, maxWidth: 100 },
        children: [{ name: "child", type: "Box", props: { bogus: 1 } }],
      },
    },
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "inverted-size-limits",
      nodeName: "card",
      prop: "maxWidth",
    }),
    expect.objectContaining({
      kind: "unknown-prop",
      nodeName: "child",
      prop: "bogus",
    }),
  ]);
});

test("自由配置の親の下の fill に逆転も書くと、fill のエラーの前に並ぶ", () => {
  const document = documentWithArtboard({
    props: { layout: "free" },
    children: [
      {
        name: "target",
        type: "Box",
        props: { widthMode: "fill", minWidth: 500, maxWidth: 100 },
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "inverted-size-limits",
      nodeName: "target",
      prop: "maxWidth",
    }),
    expect.objectContaining({
      kind: "fill-in-free-parent",
      nodeName: "target",
      prop: "widthMode",
    }),
  ]);
});

test("artboard の props に逆転を書いてもエラーにならない", () => {
  const document = documentWithArtboard({
    props: { layout: "column", minWidth: 500, maxWidth: 100 },
    children: [
      {
        name: "target",
        type: "Box",
        props: { widthMode: "hug", minWidth: 500, maxWidth: 100 },
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "inverted-size-limits",
      nodeName: "target",
      prop: "maxWidth",
    }),
  ]);
});

test("下限・上限を持たない Ellipse に逆転を書くと、未知の prop だけが出る", () => {
  const document = documentWithArtboard({
    tokens: DocumentTemplate.Default.tokens,
    props: { layout: "column" },
    children: [
      {
        name: "target",
        type: "Ellipse",
        props: { widthMode: "fill", minWidth: 500, maxWidth: 100 },
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "unknown-prop",
      nodeName: "target",
      prop: "minWidth",
    }),
    expect.objectContaining({
      kind: "unknown-prop",
      nodeName: "target",
      prop: "maxWidth",
    }),
  ]);
});

test("逆転のエラーの本文は、最小と最大の両方の prop 名を含む", () => {
  const document = documentWithBox({
    widthMode: "hug",
    minWidth: 500,
    maxWidth: 100,
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      message: expect.stringMatching(
        /minWidth[\s\S]*maxWidth|maxWidth[\s\S]*minWidth/,
      ),
    }),
  ]);
});

test("同じノードのスキーマ違反と最小 / 最大の逆転は、スキーマ違反が先に並ぶ", () => {
  const document = documentWithBox({
    bogus: 1,
    widthMode: "hug",
    minWidth: 500,
    maxWidth: 100,
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "unknown-prop",
      nodeName: "target",
      prop: "bogus",
    }),
    expect.objectContaining({
      kind: "inverted-size-limits",
      nodeName: "target",
      prop: "maxWidth",
    }),
  ]);
});

test("インスタンスの overrides で生じる逆転はエラーにしない", () => {
  const document = DesignDocument.create({
    components: {
      card: {
        type: "Box",
        children: [
          {
            name: "card-body",
            type: "Box",
            props: { minWidth: 200, maxWidth: 300 },
          },
          {
            name: "card-broken",
            type: "Box",
            props: { minWidth: 500, maxWidth: 100 },
          },
        ],
        publicProps: { limit: { node: "card-body", prop: "maxWidth" } },
      },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        props: { layout: "column" },
        children: [
          { name: "instance", ref: "card", overrides: { limit: 100 } },
        ],
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "inverted-size-limits",
      nodeName: "card-broken",
      prop: "maxWidth",
    }),
  ]);
});

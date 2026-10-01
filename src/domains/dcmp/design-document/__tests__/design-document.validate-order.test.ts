import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "../index";

/**
 * 部品と artboard の両方に、種類の違うエラーを混ぜて持つドキュメント。
 *
 * 部品 `card` の中は `alpha { beta { gamma }, delta }` の形で、兄弟と孫の並びが行きがけ順か
 * どうかが出力に出る。artboard では参照ノード `instance` をプリミティブ `plain` より前に
 * 置き、並びが子の順ではなく「props → 子 → 参照」の順で決まることが出力に出る。
 *
 * @returns エラーを持つドキュメント
 */
function documentWithMixedErrors(): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      card: {
        type: "Box",
        props: { layout: "free", "card-extra": 1 },
        children: [
          {
            name: "alpha",
            type: "Box",
            props: { widthMode: "fill", "alpha-extra": 1 },
            children: [
              {
                name: "beta",
                type: "Frame",
                children: [
                  { name: "gamma", type: "Box", props: { "gamma-extra": 1 } },
                ],
              },
              { name: "delta", type: "Box", props: { "delta-extra": 1 } },
            ],
          },
          { name: "missing-instance", ref: "missing" },
        ],
        publicProps: {
          "1": { node: "alpha", prop: "no-such-prop" },
          label: { node: "ghost", prop: "content" },
        },
      },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "instance", ref: "card", overrides: { caption: "x" } },
          { name: "plain", type: "Box", props: { "plain-extra": 1 } },
        ],
      },
    ],
  });
}

// 見たいのは並びだけ。kind を並べて比べるのは、同じ位置（card の "1"）に出る宣言名と
// binding のエラーの前後を見分けるため。
test("エラーは部品ごとに props・子の行きがけ順・宣言名・binding・参照の順、続いて artboard の子・参照の順に並ぶ", () => {
  const errors = DesignDocument.collectErrors(documentWithMixedErrors());

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "unknown-prop",
      nodeName: "card",
      prop: "card-extra",
    }),
    expect.objectContaining({
      kind: "unknown-prop",
      nodeName: "alpha",
      prop: "alpha-extra",
    }),
    expect.objectContaining({
      kind: "fill-in-free-parent",
      nodeName: "alpha",
      prop: "widthMode",
    }),
    expect.objectContaining({ kind: "unknown-type", nodeName: "beta" }),
    expect.objectContaining({
      kind: "unknown-prop",
      nodeName: "gamma",
      prop: "gamma-extra",
    }),
    expect.objectContaining({
      kind: "unknown-prop",
      nodeName: "delta",
      prop: "delta-extra",
    }),
    expect.objectContaining({
      kind: "invalid-public-prop-name",
      nodeName: "card",
      prop: "1",
    }),
    expect.objectContaining({
      kind: "dangling-binding-prop",
      nodeName: "card",
      prop: "1",
    }),
    expect.objectContaining({
      kind: "dangling-binding-node",
      nodeName: "card",
      prop: "label",
    }),
    expect.objectContaining({
      kind: "dangling-ref",
      nodeName: "missing-instance",
    }),
    expect.objectContaining({
      kind: "unknown-prop",
      nodeName: "plain",
      prop: "plain-extra",
    }),
    expect.objectContaining({
      kind: "undeclared-override",
      nodeName: "instance",
      prop: "caption",
    }),
  ]);
});

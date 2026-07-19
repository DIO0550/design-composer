import { expect, test } from "vitest";
import { DesignDocument } from "../index";

test("トップレベルのノードを部品化すると components に追加される", () => {
  const box = { name: "box-1", type: "Box", props: { padding: 8 } };
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [box] }],
  });

  const result = DesignDocument.createComponent(document, "box-1", "card");

  expect(result.components.card).toEqual({
    type: "Box",
    props: { padding: 8 },
  });
});

test("部品化すると元の位置に参照ノード { name, ref } が置かれる", () => {
  const box = { name: "box-1", type: "Box", props: { padding: 8 } };
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [box] }],
  });

  const result = DesignDocument.createComponent(document, "box-1", "card");

  expect(result.artboards[0].children).toEqual([
    { name: "box-1", ref: "card" },
  ]);
});

test("子を持つノードを部品化すると children ごと components へ移動する", () => {
  const label = { name: "label", type: "Text" };
  const box = { name: "box-1", type: "Box", children: [label] };
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [box] }],
  });

  const result = DesignDocument.createComponent(document, "box-1", "card");

  expect(result.components.card).toEqual({
    type: "Box",
    children: [label],
  });
});

test("ネストしたノードを部品化すると親ノードの children 内の位置が参照ノードに置き換わる", () => {
  const label = { name: "label", type: "Text" };
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "box-1", type: "Box", children: [label] }],
      },
    ],
  });

  const result = DesignDocument.createComponent(document, "label", "badge");

  expect(result.artboards[0].children).toEqual([
    { name: "box-1", type: "Box", children: [{ name: "label", ref: "badge" }] },
  ]);
});

test("createComponent は元のドキュメントを変更しない", () => {
  const box = { name: "box-1", type: "Box" };
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [box] }],
  });

  DesignDocument.createComponent(document, "box-1", "card");

  expect(document.artboards[0].children).toEqual([box]);
  expect(document.components).toEqual({});
});

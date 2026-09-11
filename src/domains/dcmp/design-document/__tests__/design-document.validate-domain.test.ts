import { expect, test } from "vitest";
import { DesignDocument } from "../index";

test("enum 外の値を指定すると enum-violation エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "box-1", type: "Box", props: { layout: "diagonal" } },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "enum-violation",
      nodeName: "box-1",
      prop: "layout",
    }),
  ]);
});

test("literalType と異なる型の値を指定すると literal-type-mismatch エラーになる", () => {
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
            props: { widthMode: "fixed", width: "100" },
          },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "literal-type-mismatch",
      nodeName: "box-1",
      prop: "width",
    }),
  ]);
});

test("宣言された範囲を外れた値を指定すると range-violation エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "box-1", type: "Box", props: { opacity: 1.5 } }],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "range-violation",
      nodeName: "box-1",
      prop: "opacity",
    }),
  ]);
});

test("存在しないトークン名を参照すると dangling-token エラーになる", () => {
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
            props: { background: "no-such-color" },
          },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "dangling-token",
      nodeName: "box-1",
      prop: "background",
    }),
  ]);
});

test("components 内のノードもスキーマ検証の対象になる", () => {
  const document = DesignDocument.create({
    components: {
      card: { type: "Box", props: { layout: "diagonal" } },
    },
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "enum-violation", nodeName: "card" }),
  ]);
});

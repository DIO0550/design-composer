import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "../index";

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

test("Box に負の layerBlur を指定すると range-violation エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "box-1", type: "Box", props: { layerBlur: -1 } }],
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "range-violation",
      nodeName: "box-1",
      prop: "layerBlur",
    }),
  ]);
});

test("Ellipse に負の backdropBlur を指定すると range-violation エラーになる", () => {
  // Ellipse の既定の塗りが指すトークンを置き、範囲違反だけが報告される状態にする
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "dot", type: "Ellipse", props: { backdropBlur: -1 } },
        ],
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "range-violation",
      nodeName: "dot",
      prop: "backdropBlur",
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

test("fixed のノードに書いた最小 / 最大はエラーにならず読み捨てられる", () => {
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
            props: { widthMode: "fixed", width: 100, minWidth: 50 },
          },
          {
            name: "box-2",
            type: "Box",
            props: { widthMode: "fixed", width: 100, unknownLimit: 50 },
          },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "unknown-prop",
      nodeName: "box-2",
      prop: "unknownLimit",
    }),
  ]);
});

/** `screen` の直下に、指したロックを書いたインスタンスを 1 つ置く。 */
function setupInstanceDocument(locking: string): DesignDocument {
  return DesignDocument.create({
    components: { "primary-button": { type: "Box" } },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "login", ref: "primary-button", locking }],
      },
    ],
  });
}

test("インスタンスに語彙に無い綴りのロックを書くと enum-violation エラーになる", () => {
  const errors = DesignDocument.collectErrors(setupInstanceDocument("frozen"));

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "enum-violation",
      nodeName: "login",
      prop: "locking",
    }),
  ]);
});

test("インスタンスに正当なロックを書いてもエラーにならない", () => {
  expect(DesignDocument.collectErrors(setupInstanceDocument("locked"))).toEqual(
    [],
  );
});

test("部品定義の中のインスタンスに書いたロックも検証の対象になる", () => {
  const document = DesignDocument.create({
    components: {
      "primary-button": { type: "Box" },
      card: {
        type: "Box",
        children: [
          { name: "card-action", ref: "primary-button", locking: "frozen" },
        ],
      },
    },
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "enum-violation",
      nodeName: "card-action",
      prop: "locking",
    }),
  ]);
});

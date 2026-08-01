import { expect, test } from "vitest";
import { DesignDocument } from "../../index";

test("存在しない部品名を参照すると dangling-ref エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "instance", ref: "no-such-component" }],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "dangling-ref", nodeName: "instance" }),
  ]);
});

test("部品の内部にある ref も dangling-ref の検出対象になる", () => {
  const document = DesignDocument.create({
    components: {
      card: {
        type: "Box",
        children: [{ name: "card-slot", ref: "no-such-component" }],
      },
    },
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "dangling-ref", nodeName: "card-slot" }),
  ]);
});

test("複数の dangling ref があるとすべて報告される", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "instance-1", ref: "missing-a" },
          {
            name: "wrapper",
            type: "Box",
            children: [{ name: "instance-2", ref: "missing-b" }],
          },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "dangling-ref", nodeName: "instance-1" }),
    expect.objectContaining({ kind: "dangling-ref", nodeName: "instance-2" }),
  ]);
});

test("自分自身を参照する部品は circular-ref エラーになる", () => {
  const document = DesignDocument.create({
    components: {
      card: {
        type: "Box",
        children: [{ name: "card-inner", ref: "card" }],
      },
    },
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "circular-ref", nodeName: "card" }),
  ]);
});

test("互いを参照し合う2つの部品は両方が circular-ref エラーになる", () => {
  const document = DesignDocument.create({
    components: {
      a: { type: "Box", children: [{ name: "a-inner", ref: "b" }] },
      b: { type: "Box", children: [{ name: "b-inner", ref: "a" }] },
    },
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "circular-ref", nodeName: "a" }),
    expect.objectContaining({ kind: "circular-ref", nodeName: "b" }),
  ]);
});

test("3つの部品を経由する循環参照も検出される", () => {
  const document = DesignDocument.create({
    components: {
      a: { type: "Box", children: [{ name: "a-inner", ref: "b" }] },
      b: { type: "Box", children: [{ name: "b-inner", ref: "c" }] },
      c: { type: "Box", children: [{ name: "c-inner", ref: "a" }] },
    },
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "circular-ref", nodeName: "a" }),
    expect.objectContaining({ kind: "circular-ref", nodeName: "b" }),
    expect.objectContaining({ kind: "circular-ref", nodeName: "c" }),
  ]);
});

test("循環していない入れ子の部品参照はエラーにならない", () => {
  const document = DesignDocument.create({
    components: {
      label: { type: "Text" },
      button: {
        type: "Box",
        children: [{ name: "button-label", ref: "label" }],
      },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "submit", ref: "button" }],
      },
    ],
  });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

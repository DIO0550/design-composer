import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/component";
import type { PrimitiveNode, RefNode } from "@/domains/node";
import type { Result } from "@/utils/Result";
import { InstanceComposition } from "../index";

function unwrap<T>(result: Result<T, Error>): T {
  expect(result.ok).toBe(true);
  return (result as { ok: true; value: T }).value;
}

const components: ComponentSet = {
  "primary-button": {
    type: "Box",
    props: { background: "primary", radius: "md" },
    children: [
      {
        name: "primary-button-label",
        type: "Text",
        props: { content: "Button" },
      },
    ],
    publicProps: {
      label: { node: "primary-button-label", prop: "content" },
    },
  },
};

test("ref ノードを展開すると部品定義の type と props を継承した実ツリーになる", () => {
  const instance: RefNode = { name: "save-button", ref: "primary-button" };

  const expanded = unwrap(InstanceComposition.expand(instance, components));

  expect(expanded).toEqual({
    name: "save-button",
    type: "Box",
    props: { background: "primary", radius: "md" },
    children: [
      {
        name: "primary-button-label",
        type: "Text",
        props: { content: "Button" },
      },
    ],
  });
});

test("overrides で publicProps に binding された内部ノードの prop が上書きされる", () => {
  const instance: RefNode = {
    name: "save-button",
    ref: "primary-button",
    overrides: { label: "保存" },
  };

  const expanded = unwrap(InstanceComposition.expand(instance, components));

  expect(expanded.children?.[0]).toEqual({
    name: "primary-button-label",
    type: "Text",
    props: { content: "保存" },
  });
});

test("overrides を指定しないインスタンスは部品定義そのままの値になる", () => {
  const instance: RefNode = { name: "save-button", ref: "primary-button" };

  const expanded = unwrap(InstanceComposition.expand(instance, components));

  expect(expanded.children?.[0]).toEqual({
    name: "primary-button-label",
    type: "Text",
    props: { content: "Button" },
  });
});

test("展開結果のインスタンス名は部品定義の名前ではなくインスタンス自身の name になる", () => {
  const instance: RefNode = { name: "save-button", ref: "primary-button" };

  const expanded = unwrap(InstanceComposition.expand(instance, components));

  expect(expanded.name).toBe("save-button");
});

test("expand は渡された部品定義を書き換えない", () => {
  const frozenComponents = Object.freeze({
    ...components,
    "primary-button": Object.freeze(components["primary-button"]),
  });
  const instance: RefNode = {
    name: "save-button",
    ref: "primary-button",
    overrides: { label: "保存" },
  };

  InstanceComposition.expand(instance, frozenComponents as ComponentSet);

  expect(components["primary-button"].children?.[0]).toEqual({
    name: "primary-button-label",
    type: "Text",
    props: { content: "Button" },
  });
});

test("expandAll は複数ノードの配列を一括で展開できる", () => {
  const nodes: readonly RefNode[] = [
    { name: "save-button", ref: "primary-button" },
    {
      name: "cancel-button",
      ref: "primary-button",
      overrides: { label: "キャンセル" },
    },
  ];

  const expanded = unwrap(InstanceComposition.expandAll(nodes, components));

  expect(expanded.map((node) => node.name)).toEqual([
    "save-button",
    "cancel-button",
  ]);
  expect(expanded[1].children?.[0]).toEqual({
    name: "primary-button-label",
    type: "Text",
    props: { content: "キャンセル" },
  });
});

test("Box の子として ref ノードを含むツリーも子孫まで展開される", () => {
  const tree: PrimitiveNode = {
    name: "toolbar",
    type: "Box",
    props: { direction: "row" },
    children: [{ name: "save-button", ref: "primary-button" }],
  };

  const expanded = unwrap(InstanceComposition.expand(tree, components));

  expect(expanded.children?.[0]).toMatchObject({
    name: "save-button",
    type: "Box",
  });
});

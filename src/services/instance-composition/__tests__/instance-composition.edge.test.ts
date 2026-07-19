import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/component";
import type { RefNode } from "@/domains/node";
import { InstanceComposition } from "../index";

test("自分自身を参照する部品を展開すると無限再帰にならずエラーになる", () => {
  const components: ComponentSet = {
    "self-referencing": {
      type: "Box",
      children: [{ name: "self-instance", ref: "self-referencing" }],
    },
  };
  const instance: RefNode = { name: "root", ref: "self-referencing" };

  expect(() => InstanceComposition.expand(instance, components)).toThrow();
});

test("互いに参照し合う部品同士を展開すると無限再帰にならずエラーになる", () => {
  const components: ComponentSet = {
    "component-a": {
      type: "Box",
      children: [{ name: "b-instance", ref: "component-b" }],
    },
    "component-b": {
      type: "Box",
      children: [{ name: "a-instance", ref: "component-a" }],
    },
  };
  const instance: RefNode = { name: "root", ref: "component-a" };

  expect(() => InstanceComposition.expand(instance, components)).toThrow();
});

test("同じ部品を兄弟として複数回インスタンス化しても循環とはみなさずどちらも展開される", () => {
  const components: ComponentSet = {
    "primary-button": {
      type: "Box",
      children: [{ name: "label", type: "Text", props: { content: "Button" } }],
    },
  };
  const nodes: readonly RefNode[] = [
    { name: "button-1", ref: "primary-button" },
    { name: "button-2", ref: "primary-button" },
  ];

  const expanded = InstanceComposition.expandAll(nodes, components);

  expect(expanded.map((node) => node.name)).toEqual(["button-1", "button-2"]);
  expect(expanded[0].children?.[0]).toEqual(expanded[1].children?.[0]);
});

test("存在しない部品への参照を展開しようとするとエラーになる", () => {
  const components: ComponentSet = {};
  const instance: RefNode = { name: "root", ref: "missing-component" };

  expect(() => InstanceComposition.expand(instance, components)).toThrow();
});

test("publicProps 宣言に無いキーへの overrides は無視され定義値のまま展開される", () => {
  const components: ComponentSet = {
    "primary-button": {
      type: "Box",
      children: [{ name: "label", type: "Text", props: { content: "Button" } }],
      publicProps: {
        label: { node: "label", prop: "content" },
      },
    },
  };
  const instance: RefNode = {
    name: "save-button",
    ref: "primary-button",
    overrides: { unknownKey: "無視されるべき値" },
  };

  const expanded = InstanceComposition.expand(instance, components);

  expect(expanded.children?.[0]).toEqual({
    name: "label",
    type: "Text",
    props: { content: "Button" },
  });
});

test("publicProps 宣言を持たない部品に overrides を渡しても定義値のまま展開される", () => {
  const components: ComponentSet = {
    plain: {
      type: "Box",
      children: [{ name: "label", type: "Text", props: { content: "Button" } }],
    },
  };
  const instance: RefNode = {
    name: "instance-1",
    ref: "plain",
    overrides: { label: "無視されるべき値" },
  };

  const expanded = InstanceComposition.expand(instance, components);

  expect(expanded.children?.[0]).toEqual({
    name: "label",
    type: "Text",
    props: { content: "Button" },
  });
});

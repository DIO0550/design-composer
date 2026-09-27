import { expect, test } from "vitest";
import { Node } from "../index";

test("起点のプリミティブは渡した親の props と対になる", () => {
  const nested = Node.collectNestedPrimitives(
    { name: "root", type: "Box" },
    { layout: "free" },
  );

  expect(nested).toEqual([
    { node: { name: "root", type: "Box" }, parentProps: { layout: "free" } },
  ]);
});

test("子は直下の親の props と対になる", () => {
  const nested = Node.collectNestedPrimitives(
    {
      name: "root",
      type: "Box",
      props: { layout: "row" },
      children: [
        {
          name: "child",
          type: "Box",
          props: { layout: "column" },
          children: [{ name: "grandchild", type: "Text" }],
        },
      ],
    },
    {},
  );

  expect(
    nested.map(({ node, parentProps }) => [node.name, parentProps]),
  ).toEqual([
    ["root", {}],
    ["child", { layout: "row" }],
    ["grandchild", { layout: "column" }],
  ]);
});

test("props を持たない親の子は空の props と対になる", () => {
  const nested = Node.collectNestedPrimitives(
    {
      name: "root",
      type: "Box",
      children: [{ name: "child", type: "Text" }],
    },
    { layout: "row" },
  );

  expect(nested[1]).toEqual({
    node: { name: "child", type: "Text" },
    parentProps: {},
  });
});

test("兄弟より先に、前の兄弟の子孫が並ぶ", () => {
  const nested = Node.collectNestedPrimitives(
    {
      name: "alpha",
      type: "Box",
      children: [
        {
          name: "beta",
          type: "Box",
          children: [{ name: "gamma", type: "Text" }],
        },
        { name: "delta", type: "Text" },
      ],
    },
    {},
  );

  expect(nested.map(({ node }) => node.name)).toEqual([
    "alpha",
    "beta",
    "gamma",
    "delta",
  ]);
});

test("参照ノードは含まれない", () => {
  const nested = Node.collectNestedPrimitives(
    {
      name: "root",
      type: "Box",
      children: [
        { name: "instance", ref: "button" },
        { name: "label", type: "Text" },
      ],
    },
    {},
  );

  expect(nested.map(({ node }) => node.name)).toEqual(["root", "label"]);
});

test("型が未知のプリミティブとその子も含まれる", () => {
  const nested = Node.collectNestedPrimitives(
    {
      name: "frame",
      type: "Frame",
      children: [{ name: "label", type: "Text" }],
    },
    {},
  );

  expect(nested.map(({ node }) => node.name)).toEqual(["frame", "label"]);
});

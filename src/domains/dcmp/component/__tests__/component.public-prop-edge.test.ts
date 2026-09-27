import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { Component, ComponentSet } from "../index";

test("存在しない部品の公開 prop は解決できない", () => {
  const target = ComponentSet.publicPropTarget(
    { card: { type: "Box" } },
    { component: "missing", prop: "title" },
  );

  expect(Option.isSome(target)).toBe(false);
});

test("宣言されていない公開 prop は解決できない", () => {
  const components = {
    card: {
      publicProps: { title: { node: "card-title", prop: "content" } },
      type: "Box",
      children: [{ name: "card-title", type: "Text" }],
    },
  };

  const target = ComponentSet.publicPropTarget(components, {
    component: "card",
    prop: "body",
  });

  expect(Option.isSome(target)).toBe(false);
});

test("binding 先のノードが部品の中に無ければ解決できない", () => {
  const components = {
    card: {
      publicProps: { title: { node: "missing-node", prop: "content" } },
      type: "Box",
      children: [{ name: "card-title", type: "Text" }],
    },
  };

  const target = ComponentSet.publicPropTarget(components, {
    component: "card",
    prop: "title",
  });

  expect(Option.isSome(target)).toBe(false);
});

test("binding 先の prop がスキーマに無ければ解決できない", () => {
  const components = {
    card: {
      publicProps: { title: { node: "card-title", prop: "unknown" } },
      type: "Box",
      children: [{ name: "card-title", type: "Text" }],
    },
  };

  const target = ComponentSet.publicPropTarget(components, {
    component: "card",
    prop: "title",
  });

  expect(Option.isSome(target)).toBe(false);
});

test("binding 先が primitive でない type なら解決できない", () => {
  const components = {
    card: {
      publicProps: { title: { node: "card-title", prop: "content" } },
      type: "Box",
      children: [{ name: "card-title", type: "Unknown" }],
    },
  };

  const target = ComponentSet.publicPropTarget(components, {
    component: "card",
    prop: "title",
  });

  expect(Option.isSome(target)).toBe(false);
});

test("参照が循環していても解決は停止し、解決できないものとして返る", () => {
  const components = {
    card: {
      publicProps: { title: { node: "card-inner", prop: "title" } },
      type: "Box",
      children: [{ name: "card-inner", ref: "card" }],
    },
  };

  const target = ComponentSet.publicPropTarget(components, {
    component: "card",
    prop: "title",
  });

  expect(Option.isSome(target)).toBe(false);
});

test("binding 先の無い上書きと有る上書きが同時にあるとき、有る方だけが反映され、ほかの子は定義値のまま", () => {
  const component: Component = {
    type: "Box",
    children: [
      { name: "title", type: "Text", props: { content: "題" } },
      { name: "body", type: "Text", props: { content: "本文" } },
    ],
    publicProps: {
      heading: { node: "title", prop: "content" },
      missing: { node: "ghost", prop: "content" },
    },
  };

  const overridden = Component.applyOverrides(component, "card", {
    heading: "新",
    missing: "消える",
  });

  expect(overridden.children).toEqual([
    { name: "title", type: "Text", props: { content: "新" } },
    { name: "body", type: "Text", props: { content: "本文" } },
  ]);
});

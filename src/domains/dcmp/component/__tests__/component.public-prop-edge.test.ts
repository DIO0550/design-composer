import { expect, test } from "vitest";
import { ComponentSet } from "../index";

test("存在しない部品の公開 prop は解決できない", () => {
  const target = ComponentSet.publicPropTarget(
    { card: { type: "Box" } },
    { component: "missing", prop: "title" },
  );

  expect(target.some).toBe(false);
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

  expect(target.some).toBe(false);
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

  expect(target.some).toBe(false);
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

  expect(target.some).toBe(false);
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

  expect(target.some).toBe(false);
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

  expect(target.some).toBe(false);
});

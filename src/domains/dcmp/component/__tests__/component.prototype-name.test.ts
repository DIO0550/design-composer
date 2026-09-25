import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { Component, ComponentSet } from "../index";

test("部品が1つも無ければ、Object.prototype 上の名前 toString の部品は定義されていない", () => {
  expect(ComponentSet.has({}, "toString")).toBe(false);
});

test("部品が1つも無ければ、constructor という名前の部品は引けない", () => {
  expect(ComponentSet.get({}, "constructor")).toEqual(Option.none);
});

test("宣言していない constructor は公開 prop とみなさない", () => {
  const component: Component = { type: "Box", publicProps: {} };

  expect(Component.isPublicProp(component, "constructor")).toBe(false);
});

test("宣言していない constructor の繋ぎ先は引けない", () => {
  const component: Component = { type: "Box", publicProps: {} };

  expect(Component.binding(component, "constructor")).toEqual(Option.none);
});

test("対応表に無い constructor というノードを指す binding は付け替えない", () => {
  const publicProps = { label: { node: "constructor", prop: "content" } };

  expect(Component.renameBindings(publicProps, {})).toEqual(publicProps);
});

test("binding 先の prop が constructor なら、スキーマに無い prop として繋ぎ先は解けない", () => {
  const components: ComponentSet = {
    button: {
      type: "Box",
      publicProps: { label: { node: "button", prop: "constructor" } },
    },
  };

  expect(
    ComponentSet.publicPropTarget(components, {
      component: "button",
      prop: "label",
    }),
  ).toEqual(Option.none);
});

test("入れ子の部品の公開 prop constructor を上書きしていなければ、設定値は内側の部品の値のまま", () => {
  const components: ComponentSet = {
    inner: {
      type: "Box",
      publicProps: {
        constructor: { node: "inner-label", prop: "content" },
      },
      children: [
        { name: "inner-label", type: "Text", props: { content: "Inner" } },
      ],
    },
    outer: {
      type: "Box",
      publicProps: { label: { node: "outer-inner", prop: "constructor" } },
      children: [{ name: "outer-inner", ref: "inner", overrides: {} }],
    },
  };

  const target = Option.unwrap(
    ComponentSet.publicPropTarget(components, {
      component: "outer",
      prop: "label",
    }),
  );

  expect(target.declared).toEqual(Option.some("Inner"));
});

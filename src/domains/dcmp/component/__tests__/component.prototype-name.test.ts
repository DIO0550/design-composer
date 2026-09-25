import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { Component, ComponentSet } from "../index";

const Button = {
  type: "Box",
  children: [{ name: "button-label", type: "Text" }],
  publicProps: { label: { node: "button-label", prop: "content" } },
};

test("定義されていない toString は、部品として定義されていないと判定される", () => {
  const components: ComponentSet = { button: Button };

  expect(ComponentSet.has(components, "toString")).toBe(false);
});

test("定義されていない constructor を名前で引くと、見つからない", () => {
  const components: ComponentSet = { button: Button };

  expect(ComponentSet.get(components, "constructor")).toEqual(Option.none);
});

test("constructor という名前で定義した部品は、名前で引ける", () => {
  const components: ComponentSet = { constructor: Button };

  expect(ComponentSet.get(components, "constructor")).toEqual(
    Option.some(Button),
  );
});

test("公開していない constructor は、公開 prop と判定されない", () => {
  expect(Component.isPublicProp(Button, "constructor")).toBe(false);
});

test("公開していない constructor の繋ぎ先を引くと、見つからない", () => {
  expect(Component.binding(Button, "constructor")).toEqual(Option.none);
});

test("constructor というノードを指す binding は、対応表に無ければ付け替えても constructor のまま", () => {
  const publicProps = { label: { node: "constructor", prop: "content" } };

  expect(Component.renameBindings(publicProps, { other: "renamed" })).toEqual(
    publicProps,
  );
});

test("公開していない constructor の上書きは、部品に反映されない", () => {
  const component = {
    type: "Box",
    publicProps: { label: { node: "button", prop: "content" } },
  };

  expect(
    Component.applyOverrides(component, "button", { constructor: "x" }),
  ).toEqual(component);
});

test("binding 先が constructor という prop のとき、公開 prop の繋ぎ先は解けない", () => {
  const components: ComponentSet = {
    button: {
      type: "Box",
      children: [{ name: "button-label", type: "Text" }],
      publicProps: { label: { node: "button-label", prop: "constructor" } },
    },
  };

  expect(
    ComponentSet.publicPropTarget(components, {
      component: "button",
      prop: "label",
    }),
  ).toEqual(Option.none);
});

test("中継する参照ノードが constructor を上書きしていなければ、内側の部品の設定値が見える", () => {
  const components: ComponentSet = {
    inner: {
      type: "Box",
      children: [
        { name: "inner-label", type: "Text", props: { content: "hi" } },
      ],
      publicProps: { constructor: { node: "inner-label", prop: "content" } },
    },
    outer: {
      type: "Box",
      children: [{ name: "relay", ref: "inner", overrides: {} }],
      publicProps: { label: { node: "relay", prop: "constructor" } },
    },
  };

  const target = ComponentSet.publicPropTarget(components, {
    component: "outer",
    prop: "label",
  });

  expect(Option.map(target, (found) => found.declared)).toEqual(
    Option.some(Option.some("hi")),
  );
});

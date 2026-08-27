import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/dcmp/component";
import { Option } from "@/utils/Option";
import { ComponentBinding } from "../index";

test("互いを参照し合う部品を辿っても打ち切られる", () => {
  const components: ComponentSet = {
    a: {
      type: "Box",
      children: [{ name: "a-inner", ref: "b" }],
      publicProps: { text: { node: "a-inner", prop: "text" } },
    },
    b: {
      type: "Box",
      children: [{ name: "b-inner", ref: "a" }],
      publicProps: { text: { node: "b-inner", prop: "text" } },
    },
  };

  const definition = ComponentBinding.resolvePropDefinition(
    components,
    ComponentBinding.create("a", { node: "a-inner", prop: "text" }),
  );

  expect(definition).toEqual(Option.none);
});

test("存在しない部品を起点にすると解決できない", () => {
  const definition = ComponentBinding.resolvePropDefinition(
    {},
    ComponentBinding.create("missing", { node: "missing", prop: "content" }),
  );

  expect(definition).toEqual(Option.none);
});

test("部品内に無いノードを指す binding は解決できない", () => {
  const components: ComponentSet = {
    button: { type: "Box", children: [{ name: "button-label", type: "Text" }] },
  };

  const definition = ComponentBinding.resolvePropDefinition(
    components,
    ComponentBinding.create("button", { node: "missing", prop: "content" }),
  );

  expect(definition).toEqual(Option.none);
});

test("スキーマに無い prop を指す binding は解決できない", () => {
  const components: ComponentSet = {
    button: { type: "Box", children: [{ name: "button-label", type: "Text" }] },
  };

  const definition = ComponentBinding.resolvePropDefinition(
    components,
    ComponentBinding.create("button", {
      node: "button-label",
      prop: "unknownProp",
    }),
  );

  expect(definition).toEqual(Option.none);
});

test("参照先が公開していない prop を指す binding は解決できない", () => {
  const components: ComponentSet = {
    button: {
      type: "Box",
      children: [{ name: "button-label", type: "Text" }],
      publicProps: { label: { node: "button-label", prop: "content" } },
    },
    card: {
      type: "Box",
      children: [{ name: "card-action", ref: "button" }],
      publicProps: { actionLabel: { node: "card-action", prop: "label" } },
    },
  };

  const definition = ComponentBinding.resolvePropDefinition(
    components,
    ComponentBinding.create("card", { node: "card-action", prop: "hidden" }),
  );

  expect(definition).toEqual(Option.none);
});

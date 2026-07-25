import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/component";
import type { RefNode } from "@/domains/node";
import type { Result } from "@/utils/Result";
import { InstanceComposition } from "../index";

function unwrap<T>(result: Result<T, Error>): T {
  expect(result.ok).toBe(true);
  return (result as { ok: true; value: T }).value;
}

test("部品のルートに binding された publicProps を上書きするとルートの prop が変わる", () => {
  const components: ComponentSet = {
    label: {
      type: "Text",
      props: { content: "Label" },
      publicProps: { text: { node: "label", prop: "content" } },
    },
  };
  const instance: RefNode = {
    name: "title",
    ref: "label",
    overrides: { text: "見出し" },
  };

  const expanded = unwrap(InstanceComposition.expand(instance, components));

  expect(expanded).toEqual({
    name: "title",
    type: "Text",
    props: { content: "見出し" },
    children: [],
  });
});

test("ルートへの上書きは binding されていない prop を保持する", () => {
  const components: ComponentSet = {
    card: {
      type: "Box",
      props: { background: "primary", radius: "md" },
      publicProps: { surface: { node: "card", prop: "background" } },
    },
  };
  const instance: RefNode = {
    name: "panel",
    ref: "card",
    overrides: { surface: "secondary" },
  };

  const expanded = unwrap(InstanceComposition.expand(instance, components));

  expect(expanded.props).toEqual({
    background: "secondary",
    radius: "md",
  });
});

test("ルートと内部ノードの両方への上書きが同時に反映される", () => {
  const components: ComponentSet = {
    button: {
      type: "Box",
      props: { background: "primary" },
      children: [
        { name: "button-label", type: "Text", props: { content: "Button" } },
      ],
      publicProps: {
        surface: { node: "button", prop: "background" },
        label: { node: "button-label", prop: "content" },
      },
    },
  };
  const instance: RefNode = {
    name: "submit",
    ref: "button",
    overrides: { surface: "secondary", label: "保存" },
  };

  const expanded = unwrap(InstanceComposition.expand(instance, components));

  expect(expanded).toEqual({
    name: "submit",
    type: "Box",
    props: { background: "secondary" },
    children: [
      { name: "button-label", type: "Text", props: { content: "保存" } },
    ],
  });
});

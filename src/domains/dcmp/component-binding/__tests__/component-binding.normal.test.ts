import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/dcmp/component";
import { ComponentBinding } from "../index";

/** ラベルの文言を外へ公開しただけの部品。binding 先はプリミティブの Text。 */
function setupButton(): ComponentSet {
  return {
    button: {
      type: "Box",
      children: [{ name: "button-label", type: "Text" }],
      publicProps: { label: { node: "button-label", prop: "content" } },
    },
  };
}

/** button を内包し、その label をさらに外へ公開した部品（インターフェースの連鎖）。 */
function setupCard(): ComponentSet {
  return {
    ...setupButton(),
    card: {
      type: "Box",
      children: [{ name: "card-action", ref: "button" }],
      publicProps: { actionLabel: { node: "card-action", prop: "label" } },
    },
  };
}

test("binding 先がプリミティブならそのノードの prop 定義が解決される", () => {
  const components = setupButton();

  const definition = ComponentBinding.resolvePropDefinition(
    components,
    ComponentBinding.create("button", {
      node: "button-label",
      prop: "content",
    }),
  );

  expect(definition).toEqual({
    some: true,
    value: expect.objectContaining({
      domain: "literal",
      literalType: "string",
    }),
  });
});

test("binding 先が ref ノードなら参照先の publicProps を辿って解決される", () => {
  const components = setupCard();

  const definition = ComponentBinding.resolvePropDefinition(
    components,
    ComponentBinding.create("card", { node: "card-action", prop: "label" }),
  );

  expect(definition).toEqual({
    some: true,
    value: expect.objectContaining({
      domain: "literal",
      literalType: "string",
    }),
  });
});

test("トークン参照 prop への binding はトークン種別を持つ定義として解決される", () => {
  const components: ComponentSet = {
    panel: {
      type: "Box",
      publicProps: { tone: { node: "panel", prop: "background" } },
    },
  };

  const definition = ComponentBinding.resolvePropDefinition(
    components,
    ComponentBinding.create("panel", { node: "panel", prop: "background" }),
  );

  expect(definition).toEqual({
    some: true,
    value: expect.objectContaining({ domain: "token", tokenKind: "colors" }),
  });
});

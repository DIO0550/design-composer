import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/component";
import type { RefNode } from "@/domains/node";
import { InstanceComposition } from "../index";

const components: ComponentSet = {
  "text-field": {
    type: "Box",
    props: { direction: "column" },
    children: [{ name: "text-field-value", type: "Text", props: { content: "" } }],
    publicProps: {
      value: { node: "text-field-value", prop: "content" },
    },
  },
  card: {
    type: "Box",
    props: { direction: "column" },
    children: [
      { name: "card-field", ref: "text-field" },
      { name: "card-title", type: "Text", props: { content: "Card" } },
    ],
    publicProps: {
      fieldValue: { node: "card-field", prop: "value" },
    },
  },
};

test("部品内の ref (ネストした部品) も再帰的に展開される", () => {
  const instance: RefNode = { name: "profile-card", ref: "card" };

  const expanded = InstanceComposition.expand(instance, components);

  expect(expanded.children?.[0]).toEqual({
    name: "card-field",
    type: "Box",
    props: { direction: "column" },
    children: [{ name: "text-field-value", type: "Text", props: { content: "" } }],
  });
});

test("親部品の publicProps から子部品の publicProps への binding がインターフェースの連鎖として反映される", () => {
  const instance: RefNode = {
    name: "profile-card",
    ref: "card",
    overrides: { fieldValue: "山田太郎" },
  };

  const expanded = InstanceComposition.expand(instance, components);

  const fieldNode = expanded.children?.[0];
  expect(fieldNode?.children?.[0]).toEqual({
    name: "text-field-value",
    type: "Text",
    props: { content: "山田太郎" },
  });
});

test("ネスト先の部品自身の子要素はそのままの構造を保つ", () => {
  const instance: RefNode = { name: "profile-card", ref: "card" };

  const expanded = InstanceComposition.expand(instance, components);

  expect(expanded.children?.[1]).toEqual({
    name: "card-title",
    type: "Text",
    props: { content: "Card" },
  });
});

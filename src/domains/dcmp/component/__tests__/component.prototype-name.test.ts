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

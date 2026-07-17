import { expect, test } from "vitest";
import { Component, ComponentSet } from "../component";

test("publicProps に宣言された名前は公開propとして判定される", () => {
  const component = {
    type: "Box",
    publicProps: { label: { node: "primary-button-label", prop: "content" } },
  };
  expect(Component.isPublicProp(component, "label")).toBe(true);
});

test("publicProps に宣言されていない名前は公開propとして判定されない", () => {
  const component = {
    type: "Box",
    publicProps: { label: { node: "primary-button-label", prop: "content" } },
  };
  expect(Component.isPublicProp(component, "background")).toBe(false);
});

test("publicProps 未設定のコンポーネントはどの名前も公開propとして判定されない", () => {
  const component = { type: "Box" };
  expect(Component.isPublicProp(component, "label")).toBe(false);
});

test("ComponentSet から名前一覧を取得すると登録されているキーが返る", () => {
  const components = {
    "primary-button": { type: "Box" },
    "text-input": { type: "Box" },
  };
  expect(ComponentSet.names(components)).toEqual([
    "primary-button",
    "text-input",
  ]);
});

test("ComponentSet から存在する名前を取得すると対応するコンポーネントが返る", () => {
  const primaryButton = { type: "Box" };
  const components = { "primary-button": primaryButton };
  expect(ComponentSet.get(components, "primary-button")).toBe(primaryButton);
});

test("ComponentSet から存在しない名前を取得すると undefined になる", () => {
  expect(ComponentSet.get({}, "primary-button")).toBeUndefined();
});

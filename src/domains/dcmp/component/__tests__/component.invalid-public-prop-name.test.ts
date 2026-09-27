import { expect, test } from "vitest";
import { Component } from "../index";

test("数字だけの宣言名が返り、そうでない宣言名は返らない", () => {
  const names = Component.collectInvalidPublicPropNames({
    type: "Box",
    children: [{ name: "label", type: "Text" }],
    publicProps: {
      label: { node: "label", prop: "content" },
      "20": { node: "label", prop: "content" },
    },
  });

  expect(names).toEqual(["20"]);
});

test("規則を満たさない宣言名が複数あれば publicProps の列挙順に並ぶ", () => {
  const names = Component.collectInvalidPublicPropNames({
    type: "Box",
    children: [{ name: "label", type: "Text" }],
    publicProps: {
      "7": { node: "label", prop: "content" },
      "3": { node: "label", prop: "content" },
    },
  });

  expect(names).toEqual(["3", "7"]);
});

test("publicProps を持たない部品からは何も返らない", () => {
  expect(Component.collectInvalidPublicPropNames({ type: "Box" })).toEqual([]);
});

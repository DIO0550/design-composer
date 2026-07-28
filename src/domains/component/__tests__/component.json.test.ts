import { expect, test } from "vitest";
import { Json } from "@/utils/Json";
import { Result } from "@/utils/Result";
import { Component, ComponentSet } from "../index";

test("部品は type と publicProps から読み込まれる", () => {
  const component = Result.unwrap(
    Component.fromJson(
      Json.create(
        {
          type: "Box",
          publicProps: { label: { node: "card-title", prop: "content" } },
        },
        "components.card",
      ),
    ),
  );

  expect(component).toEqual({
    type: "Box",
    publicProps: { label: { node: "card-title", prop: "content" } },
  });
});

test("部品のルートは name を持たない", () => {
  const result = Component.fromJson(
    Json.create({ name: "card", type: "Box" }, "components.card"),
  );

  expect(result.ok).toBe(false);
});

test("binding に node と prop が揃っていない部品は読み込めない", () => {
  const result = Component.fromJson(
    Json.create(
      { type: "Box", publicProps: { label: { node: "card-title" } } },
      "components.card",
    ),
  );

  expect(result.ok).toBe(false);
});

test("部品は publicProps・type・props・children の順で書き出される", () => {
  const written = Component.toJson({
    type: "Box",
    props: { radius: "md" },
    children: [{ name: "card-title", type: "Text" }],
    publicProps: { title: { node: "card-title", prop: "content" } },
  });

  expect(Object.keys(written)).toEqual([
    "publicProps",
    "type",
    "props",
    "children",
  ]);
});

test("部品は名前の昇順で書き出される", () => {
  const written = ComponentSet.toJson({
    card: { type: "Box" },
    "primary-button": { type: "Box" },
    banner: { type: "Box" },
  });

  expect(Object.keys(written)).toEqual(["banner", "card", "primary-button"]);
});

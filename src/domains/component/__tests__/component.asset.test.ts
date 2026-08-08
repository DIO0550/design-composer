import { expect, test } from "vitest";
import { ComponentAsset, ComponentSet } from "../index";

test("どこからも参照されていない部品の使用数は 0 になる", () => {
  const assets = ComponentSet.assets({ card: { type: "Box" } }, []);

  expect(assets).toEqual([{ name: "card", publicPropNames: [], refCount: 0 }]);
});

test("部品の外に置いたインスタンスの数だけ使用数が増える", () => {
  const assets = ComponentSet.assets({ card: { type: "Box" } }, [
    { name: "a", ref: "card" },
    { name: "b", ref: "card" },
  ]);

  expect(assets).toEqual([{ name: "card", publicPropNames: [], refCount: 2 }]);
});

test("入れ子の奥にあるインスタンスも数える", () => {
  const assets = ComponentSet.assets({ card: { type: "Box" } }, [
    {
      name: "outer",
      type: "Box",
      children: [
        { name: "inner", type: "Box", children: [{ name: "a", ref: "card" }] },
      ],
    },
  ]);

  expect(assets).toEqual([{ name: "card", publicPropNames: [], refCount: 1 }]);
});

test("部品の中から参照されているインスタンスも数える", () => {
  const assets = ComponentSet.assets(
    {
      card: { type: "Box", children: [{ name: "card-action", ref: "button" }] },
      button: { type: "Box" },
    },
    [],
  );

  expect(assets).toEqual([
    { name: "card", publicPropNames: [], refCount: 0 },
    { name: "button", publicPropNames: [], refCount: 1 },
  ]);
});

test("部品の外と部品の中の両方から参照されている部品の使用数は合算になる", () => {
  const assets = ComponentSet.assets(
    {
      card: { type: "Box", children: [{ name: "card-action", ref: "button" }] },
      button: { type: "Box" },
    },
    [{ name: "a", ref: "button" }],
  );

  expect(assets).toEqual([
    { name: "card", publicPropNames: [], refCount: 0 },
    { name: "button", publicPropNames: [], refCount: 2 },
  ]);
});

test("部品が1つも無いとき並びは空になる", () => {
  expect(ComponentSet.assets({}, [])).toEqual([]);
});

test("定義の無い名前を参照していてもどの部品の使用数も増えない", () => {
  const assets = ComponentSet.assets({ card: { type: "Box" } }, [
    { name: "a", ref: "missing" },
  ]);

  expect(assets).toEqual([{ name: "card", publicPropNames: [], refCount: 0 }]);
});

test("自分自身を参照する部品の使用数も数えられる", () => {
  const assets = ComponentSet.assets(
    { card: { type: "Box", children: [{ name: "card-self", ref: "card" }] } },
    [],
  );

  expect(assets).toEqual([{ name: "card", publicPropNames: [], refCount: 1 }]);
});

test("互いを参照する2つの部品の使用数も数えられる", () => {
  const assets = ComponentSet.assets(
    {
      card: { type: "Box", children: [{ name: "card-action", ref: "button" }] },
      button: { type: "Box", children: [{ name: "button-body", ref: "card" }] },
    },
    [],
  );

  expect(assets).toEqual([
    { name: "card", publicPropNames: [], refCount: 1 },
    { name: "button", publicPropNames: [], refCount: 1 },
  ]);
});

test("並びは部品の定義順になる", () => {
  const assets = ComponentSet.assets(
    { card: { type: "Box" }, button: { type: "Box" }, badge: { type: "Box" } },
    [],
  );

  expect(assets.map((asset) => asset.name)).toEqual([
    "card",
    "button",
    "badge",
  ]);
});

test("部品が公開している prop の名前が並ぶ", () => {
  const assets = ComponentSet.assets(
    {
      card: {
        publicProps: {
          title: { node: "card-title", prop: "content" },
          body: { node: "card-body", prop: "content" },
        },
        type: "Box",
        children: [
          { name: "card-title", type: "Text" },
          { name: "card-body", type: "Text" },
        ],
      },
    },
    [],
  );

  expect(assets).toEqual([
    { name: "card", publicPropNames: ["title", "body"], refCount: 0 },
  ]);
});

test("どこからも参照されていない部品は使われていない扱いになる", () => {
  expect(
    ComponentAsset.isUnused({
      name: "card",
      publicPropNames: [],
      refCount: 0,
    }),
  ).toBe(true);
});

test("1度でも参照されている部品は使われている扱いになる", () => {
  expect(
    ComponentAsset.isUnused({
      name: "card",
      publicPropNames: [],
      refCount: 1,
    }),
  ).toBe(false);
});

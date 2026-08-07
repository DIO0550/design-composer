import { expect, test } from "vitest";
import { Artboard } from "@/domains/artboard";
import type { Node } from "@/domains/node";
import { ComponentSet } from "../index";

function setupArtboard(children: readonly Node[]): Artboard {
  return Artboard.create({ name: "home", width: 360, height: 240, children });
}

test("どこからも参照されていない部品の使用数は 0 になる", () => {
  const counts = ComponentSet.refCounts({ card: { type: "Box" } }, []);

  expect(counts).toEqual([{ name: "card", count: 0 }]);
});

test("artboard に置いたインスタンスの数だけ使用数が増える", () => {
  const counts = ComponentSet.refCounts(
    { card: { type: "Box" } },
    [
      setupArtboard([
        { name: "a", ref: "card" },
        { name: "b", ref: "card" },
      ]),
    ],
  );

  expect(counts).toEqual([{ name: "card", count: 2 }]);
});

test("入れ子の奥にあるインスタンスも数える", () => {
  const counts = ComponentSet.refCounts({ card: { type: "Box" } }, [
    setupArtboard([
      {
        name: "outer",
        type: "Box",
        children: [
          { name: "inner", type: "Box", children: [{ name: "a", ref: "card" }] },
        ],
      },
    ]),
  ]);

  expect(counts).toEqual([{ name: "card", count: 1 }]);
});

test("別の artboard にあるインスタンスも数える", () => {
  const counts = ComponentSet.refCounts({ card: { type: "Box" } }, [
    Artboard.create({
      name: "home",
      width: 360,
      height: 240,
      children: [{ name: "a", ref: "card" }],
    }),
    Artboard.create({
      name: "settings",
      width: 360,
      height: 240,
      children: [{ name: "b", ref: "card" }],
    }),
  ]);

  expect(counts).toEqual([{ name: "card", count: 2 }]);
});

test("部品の中から参照されているインスタンスも数える", () => {
  const counts = ComponentSet.refCounts(
    {
      card: { type: "Box", children: [{ name: "card-action", ref: "button" }] },
      button: { type: "Box" },
    },
    [],
  );

  expect(counts).toEqual([
    { name: "card", count: 0 },
    { name: "button", count: 1 },
  ]);
});

test("artboard と部品の両方から参照されている部品の使用数は合算になる", () => {
  const counts = ComponentSet.refCounts(
    {
      card: { type: "Box", children: [{ name: "card-action", ref: "button" }] },
      button: { type: "Box" },
    },
    [setupArtboard([{ name: "a", ref: "button" }])],
  );

  expect(counts).toEqual([
    { name: "card", count: 0 },
    { name: "button", count: 2 },
  ]);
});

test("部品が1つも無いとき使用数の並びは空になる", () => {
  expect(ComponentSet.refCounts({}, [setupArtboard([])])).toEqual([]);
});

test("定義の無い名前を参照していてもどの部品の使用数も増えない", () => {
  const counts = ComponentSet.refCounts(
    { card: { type: "Box" } },
    [setupArtboard([{ name: "a", ref: "missing" }])],
  );

  expect(counts).toEqual([{ name: "card", count: 0 }]);
});

test("自分自身を参照する部品の使用数も数えられる", () => {
  const counts = ComponentSet.refCounts(
    { card: { type: "Box", children: [{ name: "card-self", ref: "card" }] } },
    [],
  );

  expect(counts).toEqual([{ name: "card", count: 1 }]);
});

test("互いを参照する2つの部品の使用数も数えられる", () => {
  const counts = ComponentSet.refCounts(
    {
      card: { type: "Box", children: [{ name: "card-action", ref: "button" }] },
      button: { type: "Box", children: [{ name: "button-body", ref: "card" }] },
    },
    [],
  );

  expect(counts).toEqual([
    { name: "card", count: 1 },
    { name: "button", count: 1 },
  ]);
});

test("使用数の並びは部品の定義順になる", () => {
  const counts = ComponentSet.refCounts(
    { card: { type: "Box" }, button: { type: "Box" }, badge: { type: "Box" } },
    [],
  );

  expect(counts.map((refCount) => refCount.name)).toEqual([
    "card",
    "button",
    "badge",
  ]);
});

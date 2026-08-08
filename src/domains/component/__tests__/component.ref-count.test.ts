import { expect, test } from "vitest";
import { ComponentSet } from "../index";

test("どこからも参照されていない部品の使用数は 0 になる", () => {
  const counts = ComponentSet.refCounts({ card: { type: "Box" } }, []);

  expect(counts).toEqual([{ name: "card", count: 0 }]);
});

test("部品の外に置いたインスタンスの数だけ使用数が増える", () => {
  const counts = ComponentSet.refCounts({ card: { type: "Box" } }, [
    { name: "a", ref: "card" },
    { name: "b", ref: "card" },
  ]);

  expect(counts).toEqual([{ name: "card", count: 2 }]);
});

test("入れ子の奥にあるインスタンスも数える", () => {
  const counts = ComponentSet.refCounts({ card: { type: "Box" } }, [
    {
      name: "outer",
      type: "Box",
      children: [
        { name: "inner", type: "Box", children: [{ name: "a", ref: "card" }] },
      ],
    },
  ]);

  expect(counts).toEqual([{ name: "card", count: 1 }]);
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

test("部品の外と部品の中の両方から参照されている部品の使用数は合算になる", () => {
  const counts = ComponentSet.refCounts(
    {
      card: { type: "Box", children: [{ name: "card-action", ref: "button" }] },
      button: { type: "Box" },
    },
    [{ name: "a", ref: "button" }],
  );

  expect(counts).toEqual([
    { name: "card", count: 0 },
    { name: "button", count: 2 },
  ]);
});

test("部品が1つも無いとき使用数の並びは空になる", () => {
  expect(ComponentSet.refCounts({}, [])).toEqual([]);
});

test("定義の無い名前を参照していてもどの部品の使用数も増えない", () => {
  const counts = ComponentSet.refCounts({ card: { type: "Box" } }, [
    { name: "a", ref: "missing" },
  ]);

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

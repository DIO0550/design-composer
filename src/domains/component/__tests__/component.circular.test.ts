import { expect, test } from "vitest";
import { ComponentSet } from "../index";

test("参照を持たない部品は循環に含まれない", () => {
  const components = {
    label: { type: "Text" },
    button: { type: "Box", children: [{ name: "button-label", type: "Text" }] },
  };

  expect(ComponentSet.circularNames(components)).toEqual([]);
});

test("自分自身を参照する部品は循環として検出される", () => {
  const components = {
    card: { type: "Box", children: [{ name: "card-inner", ref: "card" }] },
  };

  expect(ComponentSet.circularNames(components)).toEqual(["card"]);
});

test("互いを参照し合う部品は両方が循環として検出される", () => {
  const components = {
    a: { type: "Box", children: [{ name: "a-inner", ref: "b" }] },
    b: { type: "Box", children: [{ name: "b-inner", ref: "a" }] },
  };

  expect(ComponentSet.circularNames(components)).toEqual(["a", "b"]);
});

test("循環に到達するだけの部品は循環として検出されない", () => {
  const components = {
    entry: { type: "Box", children: [{ name: "entry-inner", ref: "a" }] },
    a: { type: "Box", children: [{ name: "a-inner", ref: "b" }] },
    b: { type: "Box", children: [{ name: "b-inner", ref: "a" }] },
  };

  expect(ComponentSet.circularNames(components)).toEqual(["a", "b"]);
});

test("循環していない入れ子の参照は循環として検出されない", () => {
  const components = {
    label: { type: "Text" },
    button: { type: "Box", children: [{ name: "button-label", ref: "label" }] },
    card: { type: "Box", children: [{ name: "card-action", ref: "button" }] },
  };

  expect(ComponentSet.circularNames(components)).toEqual([]);
});

test("存在しない部品への参照があっても循環判定は終了する", () => {
  const components = {
    card: { type: "Box", children: [{ name: "card-inner", ref: "missing" }] },
  };

  expect(ComponentSet.circularNames(components)).toEqual([]);
});

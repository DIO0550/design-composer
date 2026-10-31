import { expect, test } from "vitest";
import { SelectionDigs } from "@/domains/session/selection-dig";
import { Pointing } from "../index";

test("同じ名前の並びと掘る量を指していれば等しい", () => {
  const a = Pointing.create(["label", "card", "home"], SelectionDigs.NoDeeper);
  const b = Pointing.create(["label", "card", "home"], SelectionDigs.NoDeeper);

  expect(Pointing.equals(a, b)).toBe(true);
});

test("名前が 1 つ違えば等しくない", () => {
  const a = Pointing.create(["label", "card", "home"], SelectionDigs.NoDeeper);
  const b = Pointing.create(["title", "card", "home"], SelectionDigs.NoDeeper);

  expect(Pointing.equals(a, b)).toBe(false);
});

test("名前の数が違えば等しくない", () => {
  const a = Pointing.create(["label", "card", "home"], SelectionDigs.NoDeeper);
  const b = Pointing.create(["card", "home"], SelectionDigs.NoDeeper);

  expect(Pointing.equals(a, b)).toBe(false);
});

test("掘る量が違えば等しくない", () => {
  const a = Pointing.create(["label", "card", "home"], SelectionDigs.NoDeeper);
  const b = Pointing.create(["label", "card", "home"], SelectionDigs.Deepest);

  expect(Pointing.equals(a, b)).toBe(false);
});

test("キャンバスの外と枠の外は等しくない", () => {
  expect(Pointing.equals(Pointing.Outside, Pointing.Nothing)).toBe(false);
});

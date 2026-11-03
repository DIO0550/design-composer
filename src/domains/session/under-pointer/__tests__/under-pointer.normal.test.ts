import { expect, test } from "vitest";
import { SelectionDigs } from "@/domains/session/selection-dig";
import { UnderPointer } from "../index";

test("同じ名前の並びと掘る量なら等しい", () => {
  const a = UnderPointer.create(
    ["label", "card", "home"],
    SelectionDigs.NoDeeper,
  );
  const b = UnderPointer.create(
    ["label", "card", "home"],
    SelectionDigs.NoDeeper,
  );

  expect(UnderPointer.equals(a, b)).toBe(true);
});

test("名前が 1 つ違えば等しくない", () => {
  const a = UnderPointer.create(
    ["label", "card", "home"],
    SelectionDigs.NoDeeper,
  );
  const b = UnderPointer.create(
    ["title", "card", "home"],
    SelectionDigs.NoDeeper,
  );

  expect(UnderPointer.equals(a, b)).toBe(false);
});

test("名前の数が違えば等しくない", () => {
  const a = UnderPointer.create(["card", "home"], SelectionDigs.NoDeeper);
  const b = UnderPointer.create(
    ["card", "home", "extra"],
    SelectionDigs.NoDeeper,
  );

  expect(UnderPointer.equals(a, b)).toBe(false);
});

test("掘る量が違えば等しくない", () => {
  const a = UnderPointer.create(
    ["label", "card", "home"],
    SelectionDigs.NoDeeper,
  );
  const b = UnderPointer.create(
    ["label", "card", "home"],
    SelectionDigs.Deepest,
  );

  expect(UnderPointer.equals(a, b)).toBe(false);
});

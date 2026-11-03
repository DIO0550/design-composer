import { expect, test } from "vitest";
import { SelectionDigs } from "@/domains/session/selection-dig";
import { UnderPointer } from "@/domains/session/under-pointer";
import { Pointing } from "../index";

test("枠の上で同じポインタの下なら等しい", () => {
  const a = Pointing.create(
    UnderPointer.create(["label", "card", "home"], SelectionDigs.NoDeeper),
  );
  const b = Pointing.create(
    UnderPointer.create(["label", "card", "home"], SelectionDigs.NoDeeper),
  );

  expect(Pointing.equals(a, b)).toBe(true);
});

test("枠の上でポインタの下が違えば等しくない", () => {
  const a = Pointing.create(
    UnderPointer.create(["label", "card", "home"], SelectionDigs.NoDeeper),
  );
  const b = Pointing.create(
    UnderPointer.create(["title", "card", "home"], SelectionDigs.NoDeeper),
  );

  expect(Pointing.equals(a, b)).toBe(false);
});

test("キャンバスの外と枠の外は等しくない", () => {
  expect(Pointing.equals(Pointing.Outside, Pointing.Nothing)).toBe(false);
});

test("枠の上と枠の外は等しくない", () => {
  const onFrame = Pointing.create(
    UnderPointer.create(["label", "card", "home"], SelectionDigs.NoDeeper),
  );

  expect(Pointing.equals(onFrame, Pointing.Nothing)).toBe(false);
});

import { expect, test } from "vitest";
import { boxSelection, propNamesOf } from "./setup";

test("サイズのモードが fixed のときだけ長さのコントロールが出る", () => {
  expect(propNamesOf(boxSelection({ widthMode: "fixed" }))).toContain("width");
});

test("サイズのモードが hug なら長さのコントロールは出ない", () => {
  expect(propNamesOf(boxSelection({ widthMode: "hug" }))).not.toContain(
    "width",
  );
});

test("サイズのモードが未指定なら既定の hug として扱われ、長さのコントロールは出ない", () => {
  expect(propNamesOf(boxSelection({}))).not.toContain("width");
});

test("条件を満たす prop だけが出るので、縦のサイズは横のモードに影響されない", () => {
  const names = propNamesOf(boxSelection({ widthMode: "fixed" }));

  expect(names).toContain("width");
  expect(names).not.toContain("height");
});

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

test("子を並べる Box では折り返しのコントロールが出る", () => {
  expect(propNamesOf(boxSelection({ layout: "row" }))).toContain("wrap");
});

test("子を並べない Box では折り返しのコントロールは出ない", () => {
  expect(propNamesOf(boxSelection({ layout: "free" }))).not.toContain("wrap");
});

test("条件を満たす prop だけが出るので、縦のサイズは横のモードに影響されない", () => {
  const names = propNamesOf(boxSelection({ widthMode: "fixed" }));

  expect(names).toContain("width");
  expect(names).not.toContain("height");
});

test("サイズのモードが hug なら最小 / 最大のコントロールが出る", () => {
  const names = propNamesOf(boxSelection({ widthMode: "hug" }));

  expect(names).toContain("minWidth");
  expect(names).toContain("maxWidth");
});

test("サイズのモードが fixed なら最小 / 最大のコントロールは出ない", () => {
  const names = propNamesOf(boxSelection({ widthMode: "fixed" }));

  expect(names).not.toContain("minWidth");
  expect(names).not.toContain("maxWidth");
});

test("縦のサイズのモードが hug なら高さの最小 / 最大のコントロールが出る", () => {
  const names = propNamesOf(boxSelection({ heightMode: "hug" }));

  expect(names).toContain("minHeight");
  expect(names).toContain("maxHeight");
});

test("縦のサイズのモードが fixed なら高さの最小 / 最大のコントロールは出ない", () => {
  const names = propNamesOf(boxSelection({ heightMode: "fixed" }));

  expect(names).not.toContain("minHeight");
  expect(names).not.toContain("maxHeight");
});

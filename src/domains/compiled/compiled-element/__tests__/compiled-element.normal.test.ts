import { expect, test } from "vitest";
import type {
  CssDeclaration,
  CssDeclarationName,
} from "@/domains/dcmp/css-declaration";
import { CssDeclaration as Declaration } from "@/domains/dcmp/css-declaration";
import {
  BoxElement,
  CompiledElement,
  EllipseElement,
  TextElement,
} from "../index";
import { setupEllipseStyle } from "./element-style-setup";

function style(
  property: CssDeclarationName,
  value: string,
): readonly CssDeclaration[] {
  return [Declaration.create(property, value)];
}

test("Box の要素は子を持つ", () => {
  const label = TextElement.create("label", style("color", "red"), "OK");

  const box = BoxElement.create("root", style("display", "flex"), [label]);

  expect(box.children).toEqual([label]);
});

test("Text の要素はテキストを持つ", () => {
  const text = TextElement.create("label", style("color", "red"), "OK");

  expect(text.content).toBe("OK");
});

test("Box・Text・Ellipse の要素は互いに区別できる", () => {
  const box = BoxElement.create("root", style("display", "flex"), []);
  const text = TextElement.create("label", style("color", "red"), "OK");
  const ellipse = EllipseElement.create("dot", style("color", "red"));

  expect([box.kind, text.kind, ellipse.kind]).toEqual([
    "box",
    "text",
    "ellipse",
  ]);
});

test("Ellipse は角を 50% 丸めて楕円になる", () => {
  expect(setupEllipseStyle({})["border-radius"]).toBe("50%");
});

test("要素の style は style 属性の形に直列化できる", () => {
  const text = TextElement.create("label", style("color", "red"), "OK");

  expect(CompiledElement.styleText(text)).toBe("color:red");
});

test("入れ子の要素は行きがけ順に並べて辿れる", () => {
  const inner = BoxElement.create("inner", style("display", "flex"), [
    TextElement.create("label", style("color", "red"), "OK"),
  ]);
  const root = BoxElement.create("root", style("display", "flex"), [inner]);

  expect(CompiledElement.flatten(root).map((element) => element.name)).toEqual([
    "root",
    "inner",
    "label",
  ]);
});

test("Ellipse の要素を辿ると自身の 1 件だけになる", () => {
  const ellipse = EllipseElement.create("dot", style("color", "red"));

  expect(CompiledElement.flatten(ellipse)).toEqual([ellipse]);
});

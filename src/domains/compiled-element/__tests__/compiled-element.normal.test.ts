import { expect, test } from "vitest";
import type { CssDeclarationName } from "@/domains/css-declaration";
import { CssDeclaration, CssDeclarations } from "@/domains/css-declaration";
import { BoxElement, CompiledElement, TextElement } from "../index";

function style(property: CssDeclarationName, value: string): CssDeclarations {
  return CssDeclarations.from([CssDeclaration.create(property, value)]);
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

test("Box の要素と Text の要素は互いに区別できる", () => {
  const box = BoxElement.create("root", style("display", "flex"), []);
  const text = TextElement.create("label", style("color", "red"), "OK");

  expect(CompiledElement.isBox(box)).toBe(true);
  expect(CompiledElement.isText(box)).toBe(false);
  expect(CompiledElement.isText(text)).toBe(true);
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

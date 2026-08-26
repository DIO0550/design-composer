import { expect, test } from "vitest";
import { CssDeclaration } from "@/domains/dcmp/css-declaration";
import { BoxElement, CompiledElement, TextElement } from "../index";

test("要素はインライン style を持つ div になる", () => {
  const element = BoxElement.create(
    "root",
    [CssDeclaration.create("display", "flex")],
    [],
  );

  expect(CompiledElement.html(element)).toBe(
    '<div data-name="root" style="display:flex"></div>',
  );
});

test("Text の内容は div の中身になる", () => {
  const element = TextElement.create(
    "label",
    [CssDeclaration.create("text-align", "left")],
    "ログイン",
  );

  expect(CompiledElement.html(element)).toBe(
    '<div data-name="label" style="text-align:left">ログイン</div>',
  );
});

test("子を持つ Box は子の div を入れ子にして出力する", () => {
  const element = BoxElement.create(
    "form",
    [CssDeclaration.create("display", "flex")],
    [
      TextElement.create("title", [], "見出し"),
      TextElement.create("body", [], "本文"),
    ],
  );

  expect(CompiledElement.html(element)).toBe(
    '<div data-name="form" style="display:flex">' +
      '<div data-name="title" style="">見出し</div>' +
      '<div data-name="body" style="">本文</div>' +
      "</div>",
  );
});

test("Text の内容に含まれるタグの記号は実体参照になりマークアップにならない", () => {
  const element = TextElement.create("label", [], "<b>強調</b>");

  expect(CompiledElement.html(element)).toBe(
    '<div data-name="label" style="">&lt;b&gt;強調&lt;/b&gt;</div>',
  );
});

test("ノード名に引用符が含まれても属性を閉じられない", () => {
  const element = TextElement.create('a" onclick="x', [], "");

  expect(CompiledElement.html(element)).toBe(
    '<div data-name="a&quot; onclick=&quot;x" style=""></div>',
  );
});

test("同じ要素からは常に同じ HTML が得られる", () => {
  const element = BoxElement.create(
    "root",
    [
      CssDeclaration.create("display", "flex"),
      CssDeclaration.create("gap", "var(--spacing-md)"),
    ],
    [TextElement.create("label", [], "テキスト")],
  );

  expect(CompiledElement.html(element)).toBe(CompiledElement.html(element));
});

import { expect, test } from "vitest";
import { ElementEx } from "@/utils/ElementEx";
import { Option } from "@/utils/Option";

/** 属性を持つ要素と持たない要素が入れ子になった木を組み、最も内側の要素を返す。 */
function setupTree(html: string): Element {
  const root = document.createElement("div");
  root.innerHTML = html;
  return Option.unwrap(
    Option.fromNullable(root.querySelector("[data-innermost]")),
  );
}

test("自身が属性を持っていればその値が最初に並ぶ", () => {
  const element = setupTree(
    '<div data-name="outer"><span data-name="inner" data-innermost></span></div>',
  );

  expect(ElementEx.attributeValuesToRoot(element, "data-name")).toEqual([
    "inner",
    "outer",
  ]);
});

test("属性を持たない要素は通り道から飛ばされる", () => {
  const element = setupTree(
    '<div data-name="outer"><span><b data-innermost></b></span></div>',
  );

  expect(ElementEx.attributeValuesToRoot(element, "data-name")).toEqual([
    "outer",
  ]);
});

test("通り道に属性を持つ要素が無ければ何も並ばない", () => {
  const element = setupTree("<div><span data-innermost></span></div>");

  expect(ElementEx.attributeValuesToRoot(element, "data-name")).toEqual([]);
});

test("要素でない対象からは何も並ばない", () => {
  expect(ElementEx.attributeValuesToRoot(document, "data-name")).toEqual([]);
});

import { expect, test } from "vitest";
import { Component, ComponentSet } from "@/domains/component";
import { DocumentTemplate } from "../index";

test("初期部品セットは仕様の4部品を持つ", () => {
  expect(ComponentSet.names(DocumentTemplate.Default.components)).toEqual([
    "primary-button",
    "secondary-button",
    "text-input",
    "card",
  ]);
});

test("初期部品はすべて publicProps を宣言している", () => {
  const { components } = DocumentTemplate.Default;

  const withoutPublicProps = Object.entries(components)
    .filter(
      ([, component]) => Component.publicPropNames(component).length === 0,
    )
    .map(([name]) => name);

  expect(withoutPublicProps).toEqual([]);
});

test("primary-button の label は内部のラベルノードの content につながっている", () => {
  const { components } = DocumentTemplate.Default;

  expect(ComponentSet.get(components, "primary-button")?.publicProps).toEqual({
    label: { node: "primary-button-label", prop: "content" },
  });
});

test("card は title と body の2つの prop を公開する", () => {
  const { components } = DocumentTemplate.Default;

  expect(
    Object.keys(ComponentSet.get(components, "card")?.publicProps ?? {}),
  ).toEqual(["title", "body"]);
});

test("secondary-button のラベルは色を指定せず Text のスキーマデフォルトに従う", () => {
  const { components } = DocumentTemplate.Default;

  expect(ComponentSet.get(components, "secondary-button")?.children).toEqual([
    {
      name: "secondary-button-label",
      type: "Text",
      props: { content: "Button" },
    },
  ]);
});

test("text-input は横幅を親いっぱいに広げる", () => {
  const { components } = DocumentTemplate.Default;

  expect(ComponentSet.get(components, "text-input")?.props?.widthMode).toBe(
    "fill",
  );
});

test("card は初期部品の中で唯一 shadow を持つ", () => {
  const { components } = DocumentTemplate.Default;

  const withShadow = Object.entries(components)
    .filter(([, component]) => component.props?.shadow !== undefined)
    .map(([name]) => name);

  expect(withShadow).toEqual(["card"]);
});

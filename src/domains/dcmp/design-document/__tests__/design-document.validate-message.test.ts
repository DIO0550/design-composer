import { expect, test } from "vitest";
import { Fade } from "@/domains/__tests__/gradient-tokens";
import type { ComponentSet } from "@/domains/dcmp/component";
import type { Node } from "@/domains/dcmp/node";
import { TokenSet } from "@/domains/dcmp/token";
import {
  DesignDocument,
  type DesignDocumentValidationError,
  DocumentTemplate,
} from "../index";

/**
 * 部品一式と、artboard 直下に置くノードからドキュメントを作り、そのエラーを返す。
 * トークンは既定のテーマを入れる（Text の既定がトークンを指すため）。
 *
 * @param components 部品一式
 * @param children `screen` という artboard の直下に置くノード
 * @returns そのドキュメントの `collectErrors` の戻り値
 */
function errorsOf(
  components: ComponentSet,
  children: readonly Node[],
): readonly DesignDocumentValidationError[] {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components,
    artboards: [{ name: "screen", width: 375, height: 812, children }],
  });
  return DesignDocument.collectErrors(document);
}

test("binding の指すノードが無いときのエラーは、部品名と公開 prop 名の位置で、そのノード名を挙げる", () => {
  const errors = errorsOf(
    {
      button: {
        type: "Box",
        publicProps: { label: { node: "ghost", prop: "content" } },
      },
    },
    [],
  );

  expect(errors).toStrictEqual([
    {
      kind: "dangling-binding-node",
      nodeName: "button",
      prop: "label",
      message: 'unknown node "ghost"',
    },
  ]);
});

test("binding の指すプリミティブに prop が無いときのエラーは、部品名と公開 prop 名の位置で、ノード名と prop 名を挙げる", () => {
  const errors = errorsOf(
    {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { spacing: { node: "button-label", prop: "gap" } },
      },
    },
    [],
  );

  expect(errors).toStrictEqual([
    {
      kind: "dangling-binding-prop",
      nodeName: "button",
      prop: "spacing",
      message: 'node "button-label" has no prop "gap"',
    },
  ]);
});

test("binding の指すインスタンスの参照先が prop を公開していないときのエラーは、部品名と公開 prop 名の位置で、参照先の部品名を挙げる", () => {
  const errors = errorsOf(
    {
      button: {
        type: "Box",
        children: [{ name: "button-icon", ref: "icon" }],
        publicProps: { size: { node: "button-icon", prop: "size" } },
      },
      icon: { type: "Box" },
    },
    [],
  );

  expect(errors).toStrictEqual([
    {
      kind: "dangling-binding-prop",
      nodeName: "button",
      prop: "size",
      message: '"size" is not a public prop of component "icon"',
    },
  ]);
});

test("参照先の部品が無いときのエラーは、インスタンス名の位置で prop を持たず、その部品名を挙げる", () => {
  const errors = errorsOf({}, [{ name: "submit", ref: "missing" }]);

  expect(errors).toStrictEqual([
    {
      kind: "dangling-ref",
      nodeName: "submit",
      message: 'unknown component "missing"',
    },
  ]);
});

test("公開されていない prop を上書きしたときのエラーは、インスタンス名と上書きした prop 名の位置で、参照先の部品名と prop 名を挙げる", () => {
  const errors = errorsOf({ button: { type: "Box" } }, [
    { name: "submit", ref: "button", overrides: { caption: "保存" } },
  ]);

  expect(errors).toStrictEqual([
    {
      kind: "undeclared-override",
      nodeName: "submit",
      prop: "caption",
      message: 'component "button" does not declare public prop "caption"',
    },
  ]);
});

test("未知の型のノードのエラーは、そのノード名の位置で prop を持たず、型名を挙げる", () => {
  const errors = errorsOf({}, [{ name: "widget", type: "Button" }]);

  expect(errors).toStrictEqual([
    {
      kind: "unknown-type",
      nodeName: "widget",
      message: 'unknown type "Button"',
    },
  ]);
});

test("未知の型のノードが子を並べない親の下で fill を持つと、未知の型のエラーのあとに fill のエラーが続く", () => {
  const errors = errorsOf({}, [
    {
      name: "panel",
      type: "Box",
      props: { layout: "free" },
      children: [
        { name: "widget", type: "Button", props: { widthMode: "fill" } },
      ],
    },
  ]);

  expect(errors).toStrictEqual([
    {
      kind: "unknown-type",
      nodeName: "widget",
      message: 'unknown type "Button"',
    },
    {
      kind: "fill-in-free-parent",
      nodeName: "widget",
      prop: "widthMode",
      message:
        'prop "widthMode" cannot be "fill" inside a parent that does not arrange its children',
    },
  ]);
});

test("子を並べない親の下で fill を持つノードのエラーは、そのノード名と widthMode の位置になる", () => {
  const errors = errorsOf({}, [
    {
      name: "panel",
      type: "Box",
      props: { layout: "free" },
      children: [{ name: "target", type: "Box", props: { widthMode: "fill" } }],
    },
  ]);

  expect(errors).toStrictEqual([
    {
      kind: "fill-in-free-parent",
      nodeName: "target",
      prop: "widthMode",
      message:
        'prop "widthMode" cannot be "fill" inside a parent that does not arrange its children',
    },
  ]);
});

test("最大幅が最小幅を下回るノードのエラーは、そのノード名と maxWidth の位置で、最小が勝つことを挙げる", () => {
  const errors = errorsOf({}, [
    {
      name: "target",
      type: "Box",
      props: { widthMode: "hug", minWidth: 500, maxWidth: 100 },
    },
  ]);

  expect(errors).toStrictEqual([
    {
      kind: "inverted-size-limits",
      nodeName: "target",
      prop: "maxWidth",
      message: 'prop "maxWidth" is less than "minWidth"; the minimum wins',
    },
  ]);
});

test("ノードの props がスキーマに無い prop を持つときのエラーは、そのノード名と prop 名の位置になる", () => {
  const errors = errorsOf({}, [
    { name: "target", type: "Box", props: { unknownProp: "x" } },
  ]);

  expect(errors).toStrictEqual([
    {
      kind: "unknown-prop",
      nodeName: "target",
      prop: "unknownProp",
      message: 'unknown prop "unknownProp"',
    },
  ]);
});

test("インスタンスの上書きの値が宣言に適合しないときのエラーは、インスタンス名と上書きした prop 名の位置になる", () => {
  const errors = errorsOf(
    {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { label: { node: "button-label", prop: "content" } },
      },
    },
    [{ name: "submit", ref: "button", overrides: { label: 1 } }],
  );

  expect(errors).toStrictEqual([
    {
      kind: "literal-type-mismatch",
      nodeName: "submit",
      prop: "label",
      message: 'prop "label" must be of type string',
    },
  ]);
});

test("宣言名の規則を満たさない公開 prop のエラーは、部品名と宣言名の位置で、その宣言名を挙げる", () => {
  const errors = errorsOf(
    {
      button: {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
        publicProps: { "1": { node: "button-label", prop: "content" } },
      },
    },
    [],
  );

  expect(errors).toStrictEqual([
    {
      kind: "invalid-public-prop-name",
      nodeName: "button",
      prop: "1",
      message: 'public prop name "1" is not a valid public prop name',
    },
  ]);
});

test("循環参照に含まれる部品のエラーは、部品ごとにその部品名の位置で prop を持たない", () => {
  const errors = errorsOf(
    {
      a: { type: "Box", children: [{ name: "a-inner", ref: "b" }] },
      b: { type: "Box", children: [{ name: "b-inner", ref: "a" }] },
    },
    [],
  );

  expect(errors).toStrictEqual([
    {
      kind: "circular-ref",
      nodeName: "a",
      message: 'component "a" is part of a circular reference',
    },
    {
      kind: "circular-ref",
      nodeName: "b",
      message: 'component "b" is part of a circular reference',
    },
  ]);
});

test("重複した名前のエラーは、その名前の位置で prop を持たない", () => {
  const errors = errorsOf({}, [
    { name: "label", type: "Text" },
    { name: "label", type: "Text" },
  ]);

  expect(errors).toStrictEqual([
    {
      kind: "duplicate-name",
      nodeName: "label",
      message: 'name "label" is not unique in the document',
    },
  ]);
});

test("識別子の規則を満たさないノード名のエラーは、その名前の位置で prop を持たない", () => {
  const errors = errorsOf({}, [{ name: "LoginForm", type: "Box" }]);

  expect(errors).toStrictEqual([
    {
      kind: "invalid-identifier",
      nodeName: "LoginForm",
      message: 'name "LoginForm" is not a valid identifier',
    },
  ]);
});

test("子ノードの名前が欠落したときのエラーは、名前を持つ最も近い祖先の位置で、子の添字を挙げる", () => {
  const errors = errorsOf({}, [
    { name: "label", type: "Text" },
    { name: "", type: "Text" },
  ]);

  expect(errors).toStrictEqual([
    {
      kind: "missing-name",
      nodeName: "screen",
      message: 'child 1 of "screen" has no name',
    },
  ]);
});

test("部品のキーが空のときのエラーは、components のパスで指し、ノード名も prop も持たない", () => {
  const errors = errorsOf({ "": { type: "Box" } }, []);

  expect(errors).toStrictEqual([
    {
      kind: "missing-name",
      documentPath: "components",
      message: 'key "" of "components" has no name',
    },
  ]);
});

test("artboard の名前が欠落したときのエラーは、artboards の添字のパスで指し、ノード名も prop も持たない", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "", width: 375, height: 812, children: [] }],
  });

  expect(DesignDocument.collectErrors(document)).toStrictEqual([
    {
      kind: "missing-name",
      documentPath: "artboards[0]",
      message: 'artboard 0 of "artboards" has no name',
    },
  ]);
});

test("規則を満たさないトークン名のエラーは、そのトークン名の位置で prop を持たず、種別を挙げる", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { Brand: "#3b82f6" } },
  });

  expect(DesignDocument.collectErrors(document)).toStrictEqual([
    {
      kind: "invalid-identifier",
      tokenName: "Brand",
      message: 'token name "Brand" in colors is not a valid identifier',
    },
  ]);
});

test("colors と gradients の両方にあるトークン名のエラーは、そのトークン名の位置で prop を持たない", () => {
  const document = DesignDocument.create({
    tokens: {
      ...TokenSet.empty(),
      colors: { brand: "#3b82f6" },
      gradients: { brand: Fade },
    },
  });

  expect(DesignDocument.collectErrors(document)).toStrictEqual([
    {
      kind: "conflicting-token-name",
      tokenName: "brand",
      message: 'token name "brand" is used in both colors and gradients',
    },
  ]);
});

test("hex でない色トークンのエラーは、そのトークン名の位置で prop を持たない", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { brand: "red" } },
  });

  expect(DesignDocument.collectErrors(document)).toStrictEqual([
    {
      kind: "invalid-color",
      tokenName: "brand",
      message:
        'color token "brand" is not a hex color in normal form (#rrggbb / #rrggbbaa)',
    },
  ]);
});

test("影トークンの色が hex でないときのエラーは、そのトークン名と color の位置になる", () => {
  const document = DesignDocument.create({
    tokens: {
      ...TokenSet.empty(),
      shadows: { sm: { x: 0, y: 1, blur: 3, color: "red" } },
    },
  });

  expect(DesignDocument.collectErrors(document)).toStrictEqual([
    {
      kind: "invalid-color",
      tokenName: "sm",
      prop: "color",
      message:
        'the color of shadow token "sm" is not a hex color in normal form (#rrggbb / #rrggbbaa)',
    },
  ]);
});

test("グラデーションの stop の色が hex でないときのエラーは、そのトークン名と stop の添字の color の位置になる", () => {
  const document = DesignDocument.create({
    tokens: {
      ...TokenSet.empty(),
      gradients: {
        hero: {
          shape: "linear",
          angle: 90,
          stops: [
            { color: "red", ratio: 0 },
            { color: "#1d4ed8", ratio: 1 },
          ],
        },
      },
    },
  });

  expect(DesignDocument.collectErrors(document)).toStrictEqual([
    {
      kind: "invalid-color",
      tokenName: "hero",
      prop: "stops[0].color",
      message:
        'the stop 0 color of gradient token "hero" is not a hex color in normal form (#rrggbb / #rrggbbaa)',
    },
  ]);
});

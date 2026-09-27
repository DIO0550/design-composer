import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { Component } from "../index";

/*
 * 名前が重複した不正な部品定義。深い方を前の兄弟の子に置くのは、浅い方が前にあると探し方に
 * よらず浅い方に当たり、`findNode` と同じ相手を選んでいるかを確かめられないため。
 */
function setupDeepFirstComponent(): Component {
  return {
    type: "Box",
    children: [
      {
        name: "row",
        type: "Box",
        children: [{ name: "label", type: "Text", props: { content: "深" } }],
      },
      { name: "label", type: "Text", props: { content: "浅" } },
    ],
    publicProps: {
      text: { node: "label", prop: "content" },
      tone: { node: "label", prop: "color" },
    },
  };
}

test("同じ名前が前の兄弟の子と直下にあるとき、上書きは findNode が返すノードに書き込まれる", () => {
  const overridden = Component.applyOverrides(
    setupDeepFirstComponent(),
    "card",
    { text: "新" },
  );

  const found = Option.unwrap(Component.findNode(overridden, "card", "label"));
  expect(found).toEqual({
    name: "label",
    type: "Text",
    props: { content: "新" },
  });
});

test("同じ名前が前の兄弟の子と直下にあるとき、findNode が返さない方のノードは定義値のまま", () => {
  const overridden = Component.applyOverrides(
    setupDeepFirstComponent(),
    "card",
    { text: "新" },
  );

  expect(overridden.children?.[1]).toEqual({
    name: "label",
    type: "Text",
    props: { content: "浅" },
  });
});

test("同じ並びに同じ名前が 2 つあるとき、上書きは先の 1 件にだけ書き込まれる", () => {
  const component: Component = {
    type: "Box",
    children: [
      { name: "label", type: "Text", props: { content: "先" } },
      { name: "label", type: "Text", props: { content: "後" } },
    ],
    publicProps: { text: { node: "label", prop: "content" } },
  };

  const overridden = Component.applyOverrides(component, "card", {
    text: "新",
  });

  expect(overridden.children).toEqual([
    { name: "label", type: "Text", props: { content: "新" } },
    { name: "label", type: "Text", props: { content: "後" } },
  ]);
});

test("同じ名前のノードが自分の子にあるとき、上書きは外側の 1 つにだけ書き込まれる", () => {
  const component: Component = {
    type: "Box",
    children: [
      {
        name: "label",
        type: "Box",
        props: { background: "primary" },
        children: [
          { name: "label", type: "Box", props: { background: "primary" } },
        ],
      },
    ],
    publicProps: { surface: { node: "label", prop: "background" } },
  };

  const overridden = Component.applyOverrides(component, "card", {
    surface: "secondary",
  });

  expect(overridden.children).toEqual([
    {
      name: "label",
      type: "Box",
      props: { background: "secondary" },
      children: [
        { name: "label", type: "Box", props: { background: "primary" } },
      ],
    },
  ]);
});

test("同じ名前を指す公開 prop が 2 つあるとき、両方の上書きが findNode の返す同じノードに反映される", () => {
  const overridden = Component.applyOverrides(
    setupDeepFirstComponent(),
    "card",
    { text: "新", tone: "danger" },
  );

  const found = Option.unwrap(Component.findNode(overridden, "card", "label"));
  expect(found).toEqual({
    name: "label",
    type: "Text",
    props: { content: "新", color: "danger" },
  });
});

test("部品名と同じ名前の内部ノードがあるとき、上書きはルートに書き込まれ内部ノードは定義値のまま", () => {
  const component: Component = {
    type: "Box",
    props: { background: "primary" },
    children: [{ name: "card", type: "Box", props: { background: "primary" } }],
    publicProps: { surface: { node: "card", prop: "background" } },
  };

  const overridden = Component.applyOverrides(component, "card", {
    surface: "secondary",
  });

  expect(overridden).toEqual({
    ...component,
    props: { background: "secondary" },
  });
});

import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/dcmp/component";
import { Option } from "@/utils/Option";
import { ComponentBinding } from "../index";

test("互いを参照し合う部品を辿っても打ち切られる", () => {
  const components: ComponentSet = {
    a: {
      type: "Box",
      children: [{ name: "a-inner", ref: "b" }],
      publicProps: { text: { node: "a-inner", prop: "text" } },
    },
    b: {
      type: "Box",
      children: [{ name: "b-inner", ref: "a" }],
      publicProps: { text: { node: "b-inner", prop: "text" } },
    },
  };

  const target = ComponentBinding.resolvePropTarget(
    components,
    ComponentBinding.create("a", { node: "a-inner", prop: "text" }),
  );

  expect(target).toEqual(Option.none);
});

test("存在しない部品を起点にすると解決できない", () => {
  const target = ComponentBinding.resolvePropTarget(
    {},
    ComponentBinding.create("missing", { node: "missing", prop: "content" }),
  );

  expect(target).toEqual(Option.none);
});

test("部品内に無いノードを指す binding は解決できない", () => {
  const components: ComponentSet = {
    button: { type: "Box", children: [{ name: "button-label", type: "Text" }] },
  };

  const target = ComponentBinding.resolvePropTarget(
    components,
    ComponentBinding.create("button", { node: "missing", prop: "content" }),
  );

  expect(target).toEqual(Option.none);
});

test("スキーマに無い prop を指す binding は解決できない", () => {
  const components: ComponentSet = {
    button: { type: "Box", children: [{ name: "button-label", type: "Text" }] },
  };

  const target = ComponentBinding.resolvePropTarget(
    components,
    ComponentBinding.create("button", {
      node: "button-label",
      prop: "unknownProp",
    }),
  );

  expect(target).toEqual(Option.none);
});

test("参照先が公開していない prop を指す binding は解決できない", () => {
  const components: ComponentSet = {
    button: {
      type: "Box",
      children: [{ name: "button-label", type: "Text" }],
      publicProps: { label: { node: "button-label", prop: "content" } },
    },
    card: {
      type: "Box",
      children: [{ name: "card-action", ref: "button" }],
      publicProps: { actionLabel: { node: "card-action", prop: "label" } },
    },
  };

  const target = ComponentBinding.resolvePropTarget(
    components,
    ComponentBinding.create("card", { node: "card-action", prop: "hidden" }),
  );

  expect(target).toEqual(Option.none);
});

test("binding 先の prop が constructor なら、スキーマに無い prop として解決できない", () => {
  const components: ComponentSet = {
    button: { type: "Box", children: [{ name: "button-label", type: "Text" }] },
  };

  const target = ComponentBinding.resolvePropTarget(
    components,
    ComponentBinding.create("button", {
      node: "button-label",
      prop: "constructor",
    }),
  );

  expect(target).toEqual(Option.none);
});

test("binding 先がプリミティブでない型なら解決できない", () => {
  const components: ComponentSet = {
    card: {
      type: "Box",
      children: [{ name: "card-title", type: "Unknown" }],
      publicProps: { title: { node: "card-title", prop: "content" } },
    },
  };

  const target = ComponentBinding.resolvePropTarget(
    components,
    ComponentBinding.create("card", { node: "card-title", prop: "content" }),
  );

  expect(target).toEqual(Option.none);
});

test("自分自身のインスタンスを指す binding を辿っても打ち切られる", () => {
  const components: ComponentSet = {
    card: {
      type: "Box",
      children: [{ name: "card-inner", ref: "card" }],
      publicProps: { title: { node: "card-inner", prop: "title" } },
    },
  };

  const target = ComponentBinding.resolvePropTarget(
    components,
    ComponentBinding.create("card", { node: "card-inner", prop: "title" }),
  );

  expect(target).toEqual(Option.none);
});

test("公開 prop 名を変えながら辿った部品へ戻ったら、戻った先の prop がプリミティブに着いても解決できない", () => {
  // 部品数を辿る段数より多くしておく。段数の上限で止める実装だと、ここでは a の label が
  // Text の content に着いてしまう
  const components: ComponentSet = {
    a: {
      type: "Box",
      children: [
        { name: "a-b", ref: "b" },
        { name: "a-label", type: "Text" },
      ],
      publicProps: {
        title: { node: "a-b", prop: "caption" },
        label: { node: "a-label", prop: "content" },
      },
    },
    b: {
      type: "Box",
      children: [{ name: "b-a", ref: "a" }],
      publicProps: { caption: { node: "b-a", prop: "label" } },
    },
    unrelated: { type: "Box" },
  };

  const target = ComponentBinding.resolvePropTarget(
    components,
    ComponentBinding.create("a", { node: "a-b", prop: "caption" }),
  );

  expect(target).toEqual(Option.none);
});

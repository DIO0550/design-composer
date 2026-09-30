import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/dcmp/component";
import { Option } from "@/utils/Option";
import { ComponentBinding } from "../index";
import { setupLabeledButton } from "./setup";

/**
 * button を内包して label を `actionLabel` として公開した部品 `row` を足した一式。
 *
 * @param overrides row の中の button インスタンスが持つ上書き
 * @returns 部品一式
 */
function setupRow(overrides: Readonly<Record<string, string>>): ComponentSet {
  return {
    ...setupLabeledButton(),
    row: {
      type: "Box",
      children: [{ name: "row-button", ref: "button", overrides }],
      publicProps: { actionLabel: { node: "row-button", prop: "label" } },
    },
  };
}

test("binding 先に部品が値を設定していれば、それが既定になる", () => {
  const target = Option.unwrap(
    ComponentBinding.resolvePropTarget(
      setupLabeledButton(),
      ComponentBinding.create("button", {
        node: "button-label",
        prop: "content",
      }),
    ),
  );

  expect(target.declared).toEqual(Option.some("Button"));
});

test("binding 先が値を設定していなければ既定は無い", () => {
  const components: ComponentSet = {
    plain: {
      type: "Box",
      children: [{ name: "plain-label", type: "Text" }],
      publicProps: { text: { node: "plain-label", prop: "content" } },
    },
  };

  const target = Option.unwrap(
    ComponentBinding.resolvePropTarget(
      components,
      ComponentBinding.create("plain", {
        node: "plain-label",
        prop: "content",
      }),
    ),
  );

  expect(target.declared).toEqual(Option.none);
});

test("途中の参照ノードが上書きしていなければ、内側のプリミティブの設定値が既定になる", () => {
  const target = Option.unwrap(
    ComponentBinding.resolvePropTarget(
      setupRow({}),
      ComponentBinding.create("row", { node: "row-button", prop: "label" }),
    ),
  );

  expect(target.declared).toEqual(Option.some("Button"));
});

test("途中の参照ノードが上書きしていれば、その値が既定になる", () => {
  const target = Option.unwrap(
    ComponentBinding.resolvePropTarget(
      setupRow({ label: "送信" }),
      ComponentBinding.create("row", { node: "row-button", prop: "label" }),
    ),
  );

  expect(target.declared).toEqual(Option.some("送信"));
});

test("外側と内側の参照ノードが両方上書きしていれば、外側の値が既定になる", () => {
  const components: ComponentSet = {
    ...setupRow({ label: "内側" }),
    panel: {
      type: "Box",
      children: [
        {
          name: "panel-row",
          ref: "row",
          overrides: { actionLabel: "外側" },
        },
      ],
      publicProps: { rowLabel: { node: "panel-row", prop: "actionLabel" } },
    },
  };

  const target = Option.unwrap(
    ComponentBinding.resolvePropTarget(
      components,
      ComponentBinding.create("panel", {
        node: "panel-row",
        prop: "actionLabel",
      }),
    ),
  );

  expect(target.declared).toEqual(Option.some("外側"));
});

test("入れ子の部品の公開 prop constructor を上書きしていなければ、設定値は内側の部品の値のまま", () => {
  const components: ComponentSet = {
    inner: {
      type: "Box",
      children: [
        { name: "inner-label", type: "Text", props: { content: "Inner" } },
      ],
      publicProps: {
        constructor: { node: "inner-label", prop: "content" },
      },
    },
    outer: {
      type: "Box",
      children: [{ name: "outer-inner", ref: "inner", overrides: {} }],
      publicProps: { label: { node: "outer-inner", prop: "constructor" } },
    },
  };

  const target = Option.unwrap(
    ComponentBinding.resolvePropTarget(
      components,
      ComponentBinding.create("outer", {
        node: "outer-inner",
        prop: "constructor",
      }),
    ),
  );

  expect(target.declared).toEqual(Option.some("Inner"));
});

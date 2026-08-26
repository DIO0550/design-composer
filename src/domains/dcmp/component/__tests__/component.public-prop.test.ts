import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { ComponentSet } from "../index";

function setupComponents(): ComponentSet {
  return {
    "primary-button": {
      publicProps: { label: { node: "primary-button-label", prop: "content" } },
      type: "Box",
      children: [
        {
          name: "primary-button-label",
          type: "Text",
          props: { content: "Button" },
        },
      ],
    },
  };
}

test("公開 prop は binding 先のプリミティブが宣言している prop の定義に解決される", () => {
  const target = Option.unwrap(
    ComponentSet.publicPropTarget(setupComponents(), {
      component: "primary-button",
      prop: "label",
    }),
  );

  expect(target.definition).toEqual({
    domain: "literal",
    literalType: "string",
    default: "",
    group: "content",
  });
});

test("binding 先に部品が値を設定していればそれが公開 prop の既定になる", () => {
  const target = Option.unwrap(
    ComponentSet.publicPropTarget(setupComponents(), {
      component: "primary-button",
      prop: "label",
    }),
  );

  expect(target.declared).toEqual(Option.some("Button"));
});

test("binding 先が値を設定していなければ既定は無い", () => {
  const components: ComponentSet = {
    plain: {
      publicProps: { text: { node: "plain-label", prop: "content" } },
      type: "Box",
      children: [{ name: "plain-label", type: "Text" }],
    },
  };

  const target = Option.unwrap(
    ComponentSet.publicPropTarget(components, {
      component: "plain",
      prop: "text",
    }),
  );

  expect(target.declared.some).toBe(false);
});

test("binding 先が部品のルート自身なら、そのルートの prop に解決される", () => {
  const components: ComponentSet = {
    panel: {
      publicProps: { background: { node: "panel", prop: "background" } },
      type: "Box",
      props: { background: "white" },
    },
  };

  const target = Option.unwrap(
    ComponentSet.publicPropTarget(components, {
      component: "panel",
      prop: "background",
    }),
  );

  expect(target.definition.domain).toBe("token");
});

test("binding 先が参照ノードなら、その部品の公開 prop としてさらに解決される", () => {
  const components: ComponentSet = {
    "primary-button": {
      publicProps: { label: { node: "primary-button-label", prop: "content" } },
      type: "Box",
      children: [
        {
          name: "primary-button-label",
          type: "Text",
          props: { content: "Button" },
        },
      ],
    },
    "action-row": {
      publicProps: {
        actionLabel: { node: "action-row-button", prop: "label" },
      },
      type: "Box",
      children: [{ name: "action-row-button", ref: "primary-button" }],
    },
  };

  const target = Option.unwrap(
    ComponentSet.publicPropTarget(components, {
      component: "action-row",
      prop: "actionLabel",
    }),
  );

  expect(target.definition.domain).toBe("literal");
});

test("途中の参照ノードが値を上書きしていれば、その値が公開 prop の既定になる", () => {
  const components: ComponentSet = {
    "primary-button": {
      publicProps: { label: { node: "primary-button-label", prop: "content" } },
      type: "Box",
      children: [
        {
          name: "primary-button-label",
          type: "Text",
          props: { content: "Button" },
        },
      ],
    },
    "action-row": {
      publicProps: {
        actionLabel: { node: "action-row-button", prop: "label" },
      },
      type: "Box",
      children: [
        {
          name: "action-row-button",
          ref: "primary-button",
          overrides: { label: "送信" },
        },
      ],
    },
  };

  const target = Option.unwrap(
    ComponentSet.publicPropTarget(components, {
      component: "action-row",
      prop: "actionLabel",
    }),
  );

  expect(target.declared).toEqual(Option.some("送信"));
});

import { expect, test } from "vitest";
import { Component } from "../index";

test("binding 先の無い上書きと有る上書きが同時にあるとき、有る方だけが反映され、ほかの子は定義値のまま", () => {
  const component: Component = {
    type: "Box",
    children: [
      { name: "title", type: "Text", props: { content: "題" } },
      { name: "body", type: "Text", props: { content: "本文" } },
    ],
    publicProps: {
      heading: { node: "title", prop: "content" },
      missing: { node: "ghost", prop: "content" },
    },
  };

  const overridden = Component.applyOverrides(component, "card", {
    heading: "新",
    missing: "消える",
  });

  expect(overridden.children).toEqual([
    { name: "title", type: "Text", props: { content: "新" } },
    { name: "body", type: "Text", props: { content: "本文" } },
  ]);
});

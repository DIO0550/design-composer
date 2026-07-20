import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/component";
import { DesignDocument } from "@/domains/design-document";
import type { Result } from "@/utils/Result";
import { InstanceComposition } from "../index";

function unwrap<T>(result: Result<T, Error>): T {
  expect(result.ok).toBe(true);
  return (result as { ok: true; value: T }).value;
}

const components: ComponentSet = {
  "primary-button": {
    type: "Box",
    props: { background: "primary" },
    children: [
      {
        name: "primary-button-label",
        type: "Text",
        props: { content: "Button" },
      },
    ],
    publicProps: {
      label: { node: "primary-button-label", prop: "content" },
    },
  },
};

test("ref ノードを解除すると部品定義の type / props / children を持つ実ノードに置き換わる", () => {
  const document = DesignDocument.create({
    components,
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "save-button", ref: "primary-button" }],
      },
    ],
  });

  const result = unwrap(InstanceComposition.detach(document, "save-button"));

  expect(result.artboards[0].children).toEqual([
    {
      name: "save-button",
      type: "Box",
      props: { background: "primary" },
      children: [
        {
          name: "primary-button-label",
          type: "Text",
          props: { content: "Button" },
        },
      ],
    },
  ]);
});

test("overrides を持つ ref ノードを解除すると overrides が焼き込まれた状態になる", () => {
  const document = DesignDocument.create({
    components,
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          {
            name: "save-button",
            ref: "primary-button",
            overrides: { label: "保存" },
          },
        ],
      },
    ],
  });

  const result = unwrap(InstanceComposition.detach(document, "save-button"));

  expect(result.artboards[0].children[0]).toMatchObject({
    children: [{ name: "primary-button-label", props: { content: "保存" } }],
  });
});

test("解除した実ノードの直下の name は既存のノード名と衝突しないようリネームされる", () => {
  const document = DesignDocument.create({
    components,
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "primary-button-label", type: "Text" },
          { name: "save-button", ref: "primary-button" },
        ],
      },
    ],
  });

  const result = unwrap(InstanceComposition.detach(document, "save-button"));

  const detached = result.artboards[0].children[1];
  expect(detached).toMatchObject({ name: "save-button" });
  expect(detached).toMatchObject({
    children: [{ name: "primary-button-label-2" }],
  });
});

test("解除した実ノード自身の name は変わらない", () => {
  const document = DesignDocument.create({
    components,
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "save-button", ref: "primary-button" }],
      },
    ],
  });

  const result = unwrap(InstanceComposition.detach(document, "save-button"));

  expect(result.artboards[0].children[0].name).toBe("save-button");
});

test("detach は元のドキュメントを変更しない", () => {
  const document = DesignDocument.create({
    components,
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "save-button", ref: "primary-button" }],
      },
    ],
  });

  InstanceComposition.detach(document, "save-button");

  expect(document.artboards[0].children).toEqual([
    { name: "save-button", ref: "primary-button" },
  ]);
});

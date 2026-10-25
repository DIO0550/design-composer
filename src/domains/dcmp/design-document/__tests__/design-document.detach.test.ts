import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/dcmp/component";
import { Result } from "@/utils/Result";
import { DesignDocument, DocumentTemplate } from "../index";

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

  const result = Result.unwrap(DesignDocument.detach(document, "save-button"));

  expect(result.artboards[0].children).toEqual([
    {
      name: "save-button",
      type: "Box",
      props: { background: "primary" },
      children: [
        {
          name: "primary-button-label-2",
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

  const result = Result.unwrap(DesignDocument.detach(document, "save-button"));

  expect(result.artboards[0].children[0]).toMatchObject({
    children: [{ name: "primary-button-label-2", props: { content: "保存" } }],
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

  const result = Result.unwrap(DesignDocument.detach(document, "save-button"));

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

  const result = Result.unwrap(DesignDocument.detach(document, "save-button"));

  expect(result.artboards[0].children[0].name).toBe("save-button");
});

test("解除したドキュメントは部品定義の内部ノード名と重複しない", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      card: { type: "Box", children: [{ name: "card-label", type: "Text" }] },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "profile-card", ref: "card" }],
      },
    ],
  });

  const result = Result.unwrap(DesignDocument.detach(document, "profile-card"));

  expect(DesignDocument.collectErrors(result)).toEqual([]);
});

test("同じ部品のインスタンスを 2 つ含む部品を解除しても、同名のノードが残らない", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      badge: { type: "Box", children: [{ name: "badge-label", type: "Text" }] },
      card: {
        type: "Box",
        children: [
          { name: "first-badge", ref: "badge" },
          { name: "second-badge", ref: "badge" },
        ],
      },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "profile-card", ref: "card" }],
      },
    ],
  });

  const result = Result.unwrap(DesignDocument.detach(document, "profile-card"));

  expect(DesignDocument.collectErrors(result)).toEqual([]);
});

test("解除しても元のドキュメントは変更されない", () => {
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

  DesignDocument.detach(document, "save-button");

  expect(document.artboards[0].children).toEqual([
    { name: "save-button", ref: "primary-button" },
  ]);
});

/** `screen` の直下に、指したインスタンスを 1 つ置く。 */
function setupInstanceDocument(
  instance: Readonly<{ name: string; ref: string; locking?: string }>,
  instanceComponents: ComponentSet,
): DesignDocument {
  return DesignDocument.create({
    components: instanceComponents,
    artboards: [
      { name: "screen", width: 375, height: 812, children: [instance] },
    ],
  });
}

test("ロックしたインスタンスを解除すると、展開した根がロックされている", () => {
  const document = setupInstanceDocument(
    { name: "save-button", ref: "primary-button", locking: "locked" },
    components,
  );

  const result = Result.unwrap(DesignDocument.detach(document, "save-button"));

  expect(DesignDocument.isLocked(result, "save-button")).toBe(true);
});

test("unlocked と書いたインスタンスは、部品の根がロックしていても解除後にロックされていない", () => {
  const document = setupInstanceDocument(
    { name: "save-button", ref: "frozen-button", locking: "unlocked" },
    {
      "frozen-button": {
        type: "Box",
        props: { locking: "locked" },
        children: [],
      },
    },
  );

  const result = Result.unwrap(DesignDocument.detach(document, "save-button"));

  expect(DesignDocument.isLocked(result, "save-button")).toBe(false);
});

test("部品の中でロックしたインスタンスは、外側のインスタンスを解除した木でもロックされている", () => {
  const document = setupInstanceDocument(
    { name: "home-card", ref: "card" },
    {
      ...components,
      card: {
        type: "Box",
        children: [
          { name: "card-action", ref: "primary-button", locking: "locked" },
        ],
      },
    },
  );

  const result = Result.unwrap(DesignDocument.detach(document, "home-card"));

  expect(DesignDocument.isLocked(result, "card-action-2")).toBe(true);
});

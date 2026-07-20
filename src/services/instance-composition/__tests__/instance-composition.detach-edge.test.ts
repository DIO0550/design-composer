import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/component";
import { DesignDocument } from "@/domains/design-document";
import type { Result } from "@/utils/Result";
import { InstanceComposition } from "../index";

function unwrap<T>(result: Result<T, Error>): T {
  expect(result.ok).toBe(true);
  return (result as { ok: true; value: T }).value;
}

test("存在しないノード名を指定して解除しようとすると Err が返る", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  const result = InstanceComposition.detach(document, "missing");

  expect(result.ok).toBe(false);
});

test("ref ノードでないノードを指定して解除しようとすると Err が返る", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "box-1", type: "Box" }],
      },
    ],
  });

  const result = InstanceComposition.detach(document, "box-1");

  expect(result.ok).toBe(false);
});

test("存在しない部品を参照する ref ノードを解除しようとすると Err が返る", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "save-button", ref: "missing-component" }],
      },
    ],
  });

  const result = InstanceComposition.detach(document, "save-button");

  expect(result.ok).toBe(false);
});

test("ネストした部品参照を持つ ref ノードを解除すると子孫まですべて実ノードに展開される", () => {
  const components: ComponentSet = {
    "text-field": {
      type: "Box",
      children: [{ name: "text-field-value", type: "Text" }],
    },
    card: {
      type: "Box",
      children: [{ name: "card-field", ref: "text-field" }],
    },
  };
  const document = DesignDocument.create({
    components,
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "profile-card", ref: "card" }],
      },
    ],
  });

  const result = unwrap(InstanceComposition.detach(document, "profile-card"));

  expect(result.artboards[0].children[0]).toEqual({
    name: "profile-card",
    type: "Box",
    children: [
      {
        name: "card-field",
        type: "Box",
        children: [{ name: "text-field-value", type: "Text" }],
      },
    ],
  });
});

import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/component";
import { DesignDocument } from "@/domains/design-document";
import { InstanceComposition } from "../index";

test("存在しないノード名を指定して解除しようとするとエラーになる", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  expect(() => InstanceComposition.detach(document, "missing")).toThrow();
});

test("ref ノードでないノードを指定して解除しようとするとエラーになる", () => {
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

  expect(() => InstanceComposition.detach(document, "box-1")).toThrow();
});

test("存在しない部品を参照する ref ノードを解除しようとするとエラーになる", () => {
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

  expect(() => InstanceComposition.detach(document, "save-button")).toThrow();
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

  const result = InstanceComposition.detach(document, "profile-card");

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

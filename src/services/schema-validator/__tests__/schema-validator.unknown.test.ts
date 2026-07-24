import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { SchemaValidator } from "../index";

test("未知の type を持つノードは unknown-type エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "widget", type: "Button" }],
      },
    ],
  });

  const errors = SchemaValidator.validate(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "unknown-type", nodeName: "widget" }),
  ]);
});

test("未知の prop を指定したノードは unknown-prop エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "box-1", type: "Box", props: { unknownProp: "x" } }],
      },
    ],
  });

  const errors = SchemaValidator.validate(document);

  expect(errors).toEqual([
    expect.objectContaining({
      kind: "unknown-prop",
      nodeName: "box-1",
      prop: "unknownProp",
    }),
  ]);
});

test("未知の type でも子ノードは独立して検証される", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          {
            name: "widget",
            type: "Button",
            children: [{ name: "label", type: "Text", props: { content: 1 } }],
          },
        ],
      },
    ],
  });

  const errors = SchemaValidator.validate(document);

  expect(errors.map((error) => error.nodeName)).toEqual(["widget", "label"]);
});

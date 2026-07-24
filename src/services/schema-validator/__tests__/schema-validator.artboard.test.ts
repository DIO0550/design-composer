import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { SchemaValidator } from "../index";

test("artboard の props も Box スキーマで検証され、enum 外の値はエラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        props: { direction: "diagonal" },
        children: [],
      },
    ],
  });

  const errors = SchemaValidator.validate(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "enum-violation", nodeName: "screen" }),
  ]);
});

test("artboard の props が Box スキーマに適合する場合はエラーにならない", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        props: { direction: "row", overflow: "clip" },
        children: [],
      },
    ],
  });

  expect(SchemaValidator.validate(document)).toEqual([]);
});

test("artboard に未知の prop を指定すると unknown-prop エラーになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        props: { notAProp: true },
        children: [],
      },
    ],
  });

  const errors = SchemaValidator.validate(document);

  expect(errors).toEqual([
    expect.objectContaining({ kind: "unknown-prop", nodeName: "screen" }),
  ]);
});

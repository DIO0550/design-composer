import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { SchemaValidator } from "../index";

test("すべての props がスキーマに適合するドキュメントはエラーを返さない", () => {
  const document = DesignDocument.create({
    tokens: {
      colors: { "gray-900": "#111111" },
      spacing: { md: 16 },
      radius: {},
      shadows: {},
      typography: {
        body: { fontSize: 14, lineHeight: 20, fontWeight: 400 },
      },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          {
            name: "box-1",
            type: "Box",
            props: { direction: "row", gap: "md", background: "gray-900" },
            children: [
              {
                name: "label",
                type: "Text",
                props: { content: "hello", typography: "body" },
              },
            ],
          },
        ],
      },
    ],
  });

  expect(SchemaValidator.validate(document)).toEqual([]);
});

test("props を指定しないノードはデフォルト値が省略されているだけなのでエラーにならない", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "label", type: "Text" }],
      },
    ],
  });

  expect(SchemaValidator.validate(document)).toEqual([]);
});

test("ref ノードはスキーマ検証の対象外になる", () => {
  const document = DesignDocument.create({
    components: { button: { type: "Box" } },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "instance", ref: "button", overrides: { anything: "goes" } },
        ],
      },
    ],
  });

  expect(SchemaValidator.validate(document)).toEqual([]);
});

test("複数の違反がある場合、最初の1件で止まらず全件報告される", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "box-1", type: "Box", props: { direction: "diagonal" } },
          { name: "label-1", type: "Text", props: { content: 42 } },
        ],
      },
    ],
  });

  const errors = SchemaValidator.validate(document);

  expect(errors).toHaveLength(2);
  expect(errors.map((error) => error.nodeName)).toEqual(["box-1", "label-1"]);
});

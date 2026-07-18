import { expect, test } from "vitest";
import { PrimitiveSchema, PropDefinition, TEXT_SCHEMA } from "../index";

test("Text は子を持てないスキーマとして定義されている", () => {
  expect(TEXT_SCHEMA.allowsChildren).toBe(false);
});

test("Text の content は生リテラル文字列でデフォルトが空文字", () => {
  const definition = TEXT_SCHEMA.props.content;
  expect(PropDefinition.isLiteral(definition)).toBe(true);
  expect(definition).toMatchObject({
    domain: "literal",
    literalType: "string",
    default: "",
  });
});

test("Text の typography は typography トークン参照でデフォルトが body", () => {
  const definition = TEXT_SCHEMA.props.typography;
  expect(PropDefinition.isToken(definition)).toBe(true);
  expect(definition).toMatchObject({
    domain: "token",
    tokenKind: "typography",
    default: "body",
  });
});

test("Text の color は colors トークン参照でデフォルトが gray-900", () => {
  const definition = TEXT_SCHEMA.props.color;
  expect(definition).toMatchObject({
    domain: "token",
    tokenKind: "colors",
    default: "gray-900",
  });
});

test("Text の align は left / center / right の enum でデフォルトが left", () => {
  const definition = TEXT_SCHEMA.props.align;
  expect(definition).toMatchObject({
    domain: "enum",
    values: ["left", "center", "right"],
    default: "left",
  });
});

test("PrimitiveSchema.forType に Text を渡すと TEXT_SCHEMA が得られる", () => {
  expect(PrimitiveSchema.forType("Text")).toBe(TEXT_SCHEMA);
});

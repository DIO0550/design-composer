import { expect, test } from "vitest";
import { PropDefinition } from "../../prop-definition";
import { PrimitiveSchema, TextSchema } from "../index";

test("Text は子を持てないスキーマとして定義されている", () => {
  expect(TextSchema.allowsChildren).toBe(false);
});

test("Text の content は生リテラル文字列でデフォルトが空文字", () => {
  const definition = TextSchema.props.content;
  expect(PropDefinition.isLiteral(definition)).toBe(true);
  expect(definition).toMatchObject({
    domain: "literal",
    literalType: "string",
    default: "",
  });
});

test("Text の typography は typography トークン参照でデフォルトが body", () => {
  const definition = TextSchema.props.typography;
  expect(PropDefinition.isToken(definition)).toBe(true);
  expect(definition).toMatchObject({
    domain: "token",
    tokenKind: "typography",
    default: "body",
  });
});

test("Text の color は colors トークン参照でデフォルトが gray-900", () => {
  const definition = TextSchema.props.color;
  expect(definition).toMatchObject({
    domain: "token",
    tokenKind: "colors",
    default: "gray-900",
  });
});

test("Text の align は left / center / right の enum でデフォルトが left", () => {
  const definition = TextSchema.props.align;
  expect(definition).toMatchObject({
    domain: "enum",
    values: ["left", "center", "right"],
    default: "left",
  });
});

test("Text を指定するとその仕様が得られる", () => {
  expect(PrimitiveSchema.forType("Text")).toBe(TextSchema);
});

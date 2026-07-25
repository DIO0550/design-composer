import { expect, test } from "vitest";
import { TokenSet } from "@/domains/token";
import { PropDefinition, PropDefinitionRecord } from "../index";

test("enum の値が values に含まれる場合、validate はエラーを返さない", () => {
  const definition = {
    domain: "enum",
    values: ["row", "column"],
    group: "layout",
  } as const;

  expect(
    PropDefinition.validate(definition, "direction", "row", TokenSet.empty()),
  ).toEqual([]);
});

test("enum の値が values に含まれない場合、validate は enum-violation を返す", () => {
  const definition = {
    domain: "enum",
    values: ["row", "column"],
    group: "layout",
  } as const;

  expect(
    PropDefinition.validate(
      definition,
      "direction",
      "diagonal",
      TokenSet.empty(),
    ),
  ).toEqual([
    expect.objectContaining({ kind: "enum-violation", prop: "direction" }),
  ]);
});

test("literalType と一致する値の場合、validate はエラーを返さない", () => {
  const definition = {
    domain: "literal",
    literalType: "number",
    group: "size",
  } as const;

  expect(
    PropDefinition.validate(definition, "width", 100, TokenSet.empty()),
  ).toEqual([]);
});

test("literalType と異なる値の場合、validate は literal-type-mismatch を返す", () => {
  const definition = {
    domain: "literal",
    literalType: "number",
    group: "size",
  } as const;

  expect(
    PropDefinition.validate(definition, "width", "100", TokenSet.empty()),
  ).toEqual([
    expect.objectContaining({ kind: "literal-type-mismatch", prop: "width" }),
  ]);
});

test("トークンセットに存在する名前の場合、validate はエラーを返さない", () => {
  const definition = {
    domain: "token",
    tokenKind: "colors",
    group: "appearance",
  } as const;
  const tokens = { ...TokenSet.empty(), colors: { "gray-900": "#111111" } };

  expect(
    PropDefinition.validate(definition, "background", "gray-900", tokens),
  ).toEqual([]);
});

test("トークンセットに存在しない名前の場合、validate は dangling-token を返す", () => {
  const definition = {
    domain: "token",
    tokenKind: "colors",
    group: "appearance",
  } as const;

  expect(
    PropDefinition.validate(
      definition,
      "background",
      "no-such-color",
      TokenSet.empty(),
    ),
  ).toEqual([
    expect.objectContaining({ kind: "dangling-token", prop: "background" }),
  ]);
});

test("スキーマに存在しない prop を渡すと、PropDefinitionRecord.validate は unknown-prop を返す", () => {
  const schema = {
    direction: { domain: "enum", values: ["row", "column"], group: "layout" },
  } satisfies Parameters<typeof PropDefinitionRecord.validate>[0];

  expect(
    PropDefinitionRecord.validate(
      schema,
      { unknownProp: "x" },
      TokenSet.empty(),
    ),
  ).toEqual([
    expect.objectContaining({ kind: "unknown-prop", prop: "unknownProp" }),
  ]);
});

test("複数の props に違反がある場合、PropDefinitionRecord.validate は最初の1件で止まらず全件返す", () => {
  const schema = {
    direction: { domain: "enum", values: ["row", "column"], group: "layout" },
    width: { domain: "literal", literalType: "number", group: "size" },
  } satisfies Parameters<typeof PropDefinitionRecord.validate>[0];

  const errors = PropDefinitionRecord.validate(
    schema,
    { direction: "diagonal", width: "100" },
    TokenSet.empty(),
  );

  expect(errors.map((error) => error.kind)).toEqual([
    "enum-violation",
    "literal-type-mismatch",
  ]);
});

import { expect, test } from "vitest";
import { TokenSet } from "@/domains/dcmp/token";
import { PropDefinition, PropDefinitionRecord } from "../index";

test("enum の prop に values に含まれる値を設定するとエラーにならない", () => {
  const definition = {
    domain: "enum",
    values: ["row", "column"],
    group: "layout",
  } as const;

  expect(
    PropDefinition.collectErrors(
      definition,
      { name: "direction", value: "row" },
      TokenSet.empty(),
    ),
  ).toEqual([]);
});

test("enum の prop に values に含まれない値を設定すると enum-violation になる", () => {
  const definition = {
    domain: "enum",
    values: ["row", "column"],
    group: "layout",
  } as const;

  expect(
    PropDefinition.collectErrors(
      definition,
      { name: "direction", value: "diagonal" },
      TokenSet.empty(),
    ),
  ).toEqual([
    expect.objectContaining({ kind: "enum-violation", prop: "direction" }),
  ]);
});

test("生リテラルの prop に literalType と一致する型の値を設定するとエラーにならない", () => {
  const definition = {
    domain: "literal",
    literalType: "number",
    group: "size",
  } as const;

  expect(
    PropDefinition.collectErrors(
      definition,
      { name: "width", value: 100 },
      TokenSet.empty(),
    ),
  ).toEqual([]);
});

test("生リテラルの prop に literalType と異なる型の値を設定すると literal-type-mismatch になる", () => {
  const definition = {
    domain: "literal",
    literalType: "number",
    group: "size",
  } as const;

  expect(
    PropDefinition.collectErrors(
      definition,
      { name: "width", value: "100" },
      TokenSet.empty(),
    ),
  ).toEqual([
    expect.objectContaining({ kind: "literal-type-mismatch", prop: "width" }),
  ]);
});

test("トークン参照の prop にトークンセットに存在する名前を設定するとエラーにならない", () => {
  const definition = {
    domain: "token",
    tokenKind: "colors",
    group: "appearance",
  } as const;
  const tokens = { ...TokenSet.empty(), colors: { "gray-900": "#111111" } };

  expect(
    PropDefinition.collectErrors(
      definition,
      { name: "background", value: "gray-900" },
      tokens,
    ),
  ).toEqual([]);
});

test("トークン参照の prop にトークンセットに存在しない名前を設定すると dangling-token になる", () => {
  const definition = {
    domain: "token",
    tokenKind: "colors",
    group: "appearance",
  } as const;

  expect(
    PropDefinition.collectErrors(
      definition,
      { name: "background", value: "no-such-color" },
      TokenSet.empty(),
    ),
  ).toEqual([
    expect.objectContaining({ kind: "dangling-token", prop: "background" }),
  ]);
});

test("スキーマに存在しない prop を設定すると unknown-prop になる", () => {
  const schema = {
    direction: { domain: "enum", values: ["row", "column"], group: "layout" },
  } satisfies Parameters<typeof PropDefinitionRecord.collectErrors>[0];

  expect(
    PropDefinitionRecord.collectErrors(
      schema,
      { unknownProp: "x" },
      TokenSet.empty(),
    ),
  ).toEqual([
    expect.objectContaining({ kind: "unknown-prop", prop: "unknownProp" }),
  ]);
});

test("複数の props に違反があると最初の1件で止まらず全件返る", () => {
  const schema = {
    direction: { domain: "enum", values: ["row", "column"], group: "layout" },
    width: { domain: "literal", literalType: "number", group: "size" },
  } satisfies Parameters<typeof PropDefinitionRecord.collectErrors>[0];

  const errors = PropDefinitionRecord.collectErrors(
    schema,
    { direction: "diagonal", width: "100" },
    TokenSet.empty(),
  );

  expect(errors.map((error) => error.kind)).toEqual([
    "enum-violation",
    "literal-type-mismatch",
  ]);
});

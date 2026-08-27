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

/**
 * デフォルトがトークンを指す prop を持つスキーマ（Text の `typography` / `color` と同じ形）。
 * 種別を 2 つに分けているのは、片方のデフォルトだけが宙に浮く入力を作れるようにするため。
 */
function schemaWithTokenDefaults() {
  return {
    typography: {
      domain: "token",
      tokenKind: "typography",
      default: "body",
      group: "appearance",
    },
    color: {
      domain: "token",
      tokenKind: "colors",
      default: "gray-900",
      group: "appearance",
    },
  } satisfies Parameters<typeof PropDefinitionRecord.collectErrors>[0];
}

const BodyTypography = { fontSize: 16, lineHeight: 1.6, fontWeight: 400 };

test("デフォルトがトークンを指す prop は、設定していなくてもそのトークンが無ければ dangling-token になる", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    colors: { "gray-900": "#111827" },
  };

  expect(
    PropDefinitionRecord.collectErrors(schemaWithTokenDefaults(), {}, tokens),
  ).toEqual([
    expect.objectContaining({ kind: "dangling-token", prop: "typography" }),
  ]);
});

test("デフォルトがトークンを指す prop は、設定していなくてもそのトークンがあればエラーにならない", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    colors: { "gray-900": "#111827" },
    typography: { body: BodyTypography },
  };

  expect(
    PropDefinitionRecord.collectErrors(schemaWithTokenDefaults(), {}, tokens),
  ).toEqual([]);
});

test("prop を明示設定していれば、デフォルトが指すトークンが無くてもエラーにならない", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    colors: { "gray-900": "#111827" },
    typography: { heading: { fontSize: 24, lineHeight: 1.3, fontWeight: 700 } },
  };

  expect(
    PropDefinitionRecord.collectErrors(
      schemaWithTokenDefaults(),
      { typography: "heading" },
      tokens,
    ),
  ).toEqual([]);
});

test("デフォルトを持たない prop は、設定していなければ検証されない", () => {
  const schema = {
    gap: { domain: "token", tokenKind: "spacing", group: "layout" },
  } satisfies Parameters<typeof PropDefinitionRecord.collectErrors>[0];

  expect(
    PropDefinitionRecord.collectErrors(schema, {}, TokenSet.empty()),
  ).toEqual([]);
});

test("明示設定の違反とデフォルトの違反は、明示設定の側を先に並べて返る", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    typography: { body: BodyTypography },
  };

  const errors = PropDefinitionRecord.collectErrors(
    schemaWithTokenDefaults(),
    { typography: "no-such-typography" },
    tokens,
  );

  expect(errors.map((error) => error.prop)).toEqual(["typography", "color"]);
});

test("デフォルトを持つスキーマでも、宣言の無い prop は unknown-prop として報告される", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    colors: { "gray-900": "#111827" },
    typography: { body: BodyTypography },
  };

  expect(
    PropDefinitionRecord.collectErrors(
      schemaWithTokenDefaults(),
      { unknownProp: "x" },
      tokens,
    ),
  ).toEqual([
    expect.objectContaining({ kind: "unknown-prop", prop: "unknownProp" }),
  ]);
});

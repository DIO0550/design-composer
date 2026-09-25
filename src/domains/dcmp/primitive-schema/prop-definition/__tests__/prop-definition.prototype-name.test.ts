import { expect, test } from "vitest";
import { TokenSet } from "@/domains/dcmp/token";
import { PropDefinition, PropDefinitionRecord } from "../index";

test("スキーマに宣言の無い constructor という prop は unknown-prop になる", () => {
  const schema = {
    layout: { domain: "enum", values: ["row", "column"], group: "layout" },
  } satisfies Parameters<typeof PropDefinitionRecord.collectErrors>[0];

  expect(
    PropDefinitionRecord.collectErrors(
      schema,
      { constructor: "x" },
      TokenSet.empty(),
    ),
  ).toEqual([
    expect.objectContaining({ kind: "unknown-prop", prop: "constructor" }),
  ]);
});

test("トークン参照の prop が存在しないトークン constructor を指すと dangling-token になる", () => {
  const definition = {
    domain: "token",
    tokenKind: "colors",
    group: "appearance",
  } as const;

  expect(
    PropDefinition.collectErrors(
      definition,
      { name: "background", value: "constructor" },
      TokenSet.empty(),
    ),
  ).toEqual([
    expect.objectContaining({ kind: "dangling-token", prop: "background" }),
  ]);
});

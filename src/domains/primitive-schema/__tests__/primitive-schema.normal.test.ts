import { expect, test } from "vitest";
import { PropDefinition, PropDefinitionRecord } from "../index";

test("domain が enum の prop 定義は isEnum で true と判定される", () => {
  const definition = {
    domain: "enum",
    values: ["row", "column"],
    group: "layout",
  } as const;
  expect(PropDefinition.isEnum(definition)).toBe(true);
});

test("domain が token の prop 定義は isToken で true と判定される", () => {
  const definition = {
    domain: "token",
    tokenKind: "spacing",
    group: "layout",
  } as const;
  expect(PropDefinition.isToken(definition)).toBe(true);
});

test("domain が literal の prop 定義は isLiteral で true と判定される", () => {
  const definition = {
    domain: "literal",
    literalType: "number",
    group: "size",
  } as const;
  expect(PropDefinition.isLiteral(definition)).toBe(true);
});

test("enabledWhen が未設定の prop 定義は isEnabled で常に true になる", () => {
  const definition = {
    domain: "literal",
    literalType: "number",
    group: "size",
  } as const;
  expect(PropDefinition.isEnabled(definition, {})).toBe(true);
});

test("enabledWhen の条件を満たす props を渡すと isEnabled が true になる", () => {
  const definition = {
    domain: "literal",
    literalType: "number",
    group: "size",
    enabledWhen: { prop: "widthMode", equals: "fixed" },
  } as const;
  expect(PropDefinition.isEnabled(definition, { widthMode: "fixed" })).toBe(
    true,
  );
});

test("prop 定義1エントリを追加すると propNames にその prop が定義順で加わる", () => {
  const schema = {
    direction: { domain: "enum", values: ["row", "column"], group: "layout" },
    gap: { domain: "token", tokenKind: "spacing", group: "layout" },
  } satisfies PropDefinitionRecord;

  const extended = {
    ...schema,
    align: {
      domain: "enum",
      values: ["start", "center", "end"],
      group: "layout",
    },
  } satisfies PropDefinitionRecord;

  expect(PropDefinitionRecord.propNames(extended)).toEqual([
    "direction",
    "gap",
    "align",
  ]);
});

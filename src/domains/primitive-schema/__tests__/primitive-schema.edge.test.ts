import { expect, test } from "vitest";
import { PRIMITIVE_TYPES, PrimitiveSchema, PropDefinition } from "../index";

test("domain が enum の prop 定義は isToken で false と判定される", () => {
  const definition = {
    domain: "enum",
    values: ["row", "column"],
    group: "layout",
  } as const;
  expect(PropDefinition.isToken(definition)).toBe(false);
});

test("domain が token の prop 定義は isLiteral で false と判定される", () => {
  const definition = {
    domain: "token",
    tokenKind: "colors",
    group: "appearance",
  } as const;
  expect(PropDefinition.isLiteral(definition)).toBe(false);
});

test("domain が literal の prop 定義は isEnum で false と判定される", () => {
  const definition = {
    domain: "literal",
    literalType: "string",
    group: "content",
  } as const;
  expect(PropDefinition.isEnum(definition)).toBe(false);
});

test("enabledWhen の条件を満たさない props を渡すと isEnabled が false になる", () => {
  const definition = {
    domain: "literal",
    literalType: "number",
    group: "size",
    enabledWhen: { prop: "widthMode", equals: "fixed" },
  } as const;
  expect(PropDefinition.isEnabled(definition, { widthMode: "hug" })).toBe(
    false,
  );
});

test("enabledWhen が参照する prop が props に存在しない場合 isEnabled は false になる", () => {
  const definition = {
    domain: "literal",
    literalType: "number",
    group: "size",
    enabledWhen: { prop: "widthMode", equals: "fixed" },
  } as const;
  expect(PropDefinition.isEnabled(definition, {})).toBe(false);
});

test("プリミティブ語彙は Box と Text の2種類に閉じている", () => {
  expect(PRIMITIVE_TYPES).toEqual(["Box", "Text"]);
});

test("Box は子要素を持てる", () => {
  expect(PrimitiveSchema.allowsChildren("Box")).toBe(true);
});

test("Text は子要素を持てない", () => {
  expect(PrimitiveSchema.allowsChildren("Text")).toBe(false);
});

test("未知の type は子要素を持てないと判定される", () => {
  expect(PrimitiveSchema.allowsChildren("Unknown")).toBe(false);
});

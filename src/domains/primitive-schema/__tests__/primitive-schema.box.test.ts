import { expect, test } from "vitest";
import { BOX_SCHEMA, PrimitiveSchema, PropDefinition } from "../index";

test("Box は子を持てるスキーマとして定義されている", () => {
  expect(BOX_SCHEMA.allowsChildren).toBe(true);
});

test("Box の direction は row / column の enum でデフォルトが column", () => {
  const definition = BOX_SCHEMA.props.direction;
  expect(PropDefinition.isEnum(definition)).toBe(true);
  expect(definition).toMatchObject({
    domain: "enum",
    values: ["row", "column"],
    default: "column",
  });
});

test("Box の gap は spacing トークン参照でデフォルトを持たない", () => {
  const definition = BOX_SCHEMA.props.gap;
  expect(PropDefinition.isToken(definition)).toBe(true);
  expect(definition).toMatchObject({ domain: "token", tokenKind: "spacing" });
  expect(definition.default).toBeUndefined();
});

test("Box の width は widthMode が fixed のときのみ有効になる", () => {
  const definition = BOX_SCHEMA.props.width;
  expect(PropDefinition.isLiteral(definition)).toBe(true);
  expect(PropDefinition.isEnabled(definition, { widthMode: "fixed" })).toBe(
    true,
  );
  expect(PropDefinition.isEnabled(definition, { widthMode: "hug" })).toBe(
    false,
  );
});

test("Box の height は heightMode が fixed のときのみ有効になる", () => {
  const definition = BOX_SCHEMA.props.height;
  expect(PropDefinition.isEnabled(definition, { heightMode: "fixed" })).toBe(
    true,
  );
  expect(PropDefinition.isEnabled(definition, { heightMode: "fill" })).toBe(
    false,
  );
});

test("Box の overflow は visible / clip の enum でデフォルトが visible", () => {
  const definition = BOX_SCHEMA.props.overflow;
  expect(definition).toMatchObject({
    domain: "enum",
    values: ["visible", "clip"],
    default: "visible",
  });
});

test("PrimitiveSchema.forType に Box を渡すと BOX_SCHEMA が得られる", () => {
  expect(PrimitiveSchema.forType("Box")).toBe(BOX_SCHEMA);
});

import { expect, test } from "vitest";
import { PropDefinition } from "../../prop-definition";
import { BoxSchema, PrimitiveSchema } from "../index";

test("Box は子を持てるスキーマとして定義されている", () => {
  expect(BoxSchema.allowsChildren).toBe(true);
});

test("Box の layout は row / column / free の enum でデフォルトが column", () => {
  const definition = BoxSchema.props.layout;
  expect(PropDefinition.isEnum(definition)).toBe(true);
  expect(definition).toMatchObject({
    domain: "enum",
    values: ["row", "column", "free"],
    default: "column",
  });
});

test("Box は向きの prop を layout に吸収して direction を宣言しない", () => {
  expect(Object.keys(BoxSchema.props)).not.toContain("direction");
});

test("Box の折り返しは nowrap / wrap の enum でデフォルトが nowrap", () => {
  const definition = BoxSchema.props.wrap;
  expect(PropDefinition.isEnum(definition)).toBe(true);
  expect(definition).toMatchObject({
    domain: "enum",
    values: ["nowrap", "wrap"],
    default: "nowrap",
  });
});

test("Box の折り返しは layout が free のとき編集できない", () => {
  expect(
    PropDefinition.isEnabled(BoxSchema.props.wrap, { layout: "free" }),
  ).toBe(false);
  expect(
    PropDefinition.isEnabled(BoxSchema.props.wrap, { layout: "row" }),
  ).toBe(true);
});

test("Box の間隔は layout が free のとき編集できない", () => {
  expect(
    PropDefinition.isEnabled(BoxSchema.props.gap, { layout: "free" }),
  ).toBe(false);
  expect(PropDefinition.isEnabled(BoxSchema.props.gap, { layout: "row" })).toBe(
    true,
  );
});

test("Box の揃えは layout が free のとき編集できない", () => {
  expect(
    PropDefinition.isEnabled(BoxSchema.props.align, { layout: "free" }),
  ).toBe(false);
  expect(
    PropDefinition.isEnabled(BoxSchema.props.align, { layout: "row" }),
  ).toBe(true);
});

test("Box の並べ方は layout が free のとき編集できない", () => {
  expect(
    PropDefinition.isEnabled(BoxSchema.props.justify, { layout: "free" }),
  ).toBe(false);
  expect(
    PropDefinition.isEnabled(BoxSchema.props.justify, { layout: "row" }),
  ).toBe(true);
});

test("Box の placement は flow / absolute の enum でデフォルトが flow", () => {
  const definition = BoxSchema.props.placement;
  expect(PropDefinition.isEnum(definition)).toBe(true);
  expect(definition).toMatchObject({
    domain: "enum",
    values: ["flow", "absolute"],
    default: "flow",
  });
});

test("Box の座標は placement が absolute のときのみ有効になる", () => {
  const definition = BoxSchema.props.x;
  expect(PropDefinition.isLiteral(definition)).toBe(true);
  expect(PropDefinition.isEnabled(definition, { placement: "absolute" })).toBe(
    true,
  );
  expect(PropDefinition.isEnabled(definition, { placement: "flow" })).toBe(
    false,
  );
});

test("Box の追従は min / max / center / stretch / scale の enum でデフォルトが min", () => {
  const definition = BoxSchema.props.constraintX;
  expect(PropDefinition.isEnum(definition)).toBe(true);
  expect(definition).toMatchObject({
    domain: "enum",
    values: ["min", "max", "center", "stretch", "scale"],
    default: "min",
  });
});

test("Box の追従は placement が absolute のときのみ有効になる", () => {
  const definition = BoxSchema.props.constraintY;
  expect(PropDefinition.isEnabled(definition, { placement: "absolute" })).toBe(
    true,
  );
  expect(PropDefinition.isEnabled(definition, { placement: "flow" })).toBe(
    false,
  );
});

test("Box の回転は生リテラルの number でデフォルトが 0", () => {
  const definition = BoxSchema.props.rotation;
  expect(PropDefinition.isLiteral(definition)).toBe(true);
  expect(definition).toMatchObject({
    domain: "literal",
    literalType: "number",
    default: 0,
  });
});

test("Box の回転は絶対配置でもフローでも有効になる", () => {
  const definition = BoxSchema.props.rotation;
  expect(PropDefinition.isEnabled(definition, { placement: "absolute" })).toBe(
    true,
  );
  expect(PropDefinition.isEnabled(definition, { placement: "flow" })).toBe(
    true,
  );
});

test("Box の回転は取りうる範囲を宣言しない", () => {
  expect("range" in BoxSchema.props.rotation).toBe(false);
});

test("Box の gap は spacing トークン参照でデフォルトを持たない", () => {
  const definition = BoxSchema.props.gap;
  expect(PropDefinition.isToken(definition)).toBe(true);
  expect(definition).toMatchObject({ domain: "token", tokenKind: ["spacing"] });
  expect("default" in definition).toBe(false);
});

test("Box の width は widthMode が fixed のときのみ有効になる", () => {
  const definition = BoxSchema.props.width;
  expect(PropDefinition.isLiteral(definition)).toBe(true);
  expect(PropDefinition.isEnabled(definition, { widthMode: "fixed" })).toBe(
    true,
  );
  expect(PropDefinition.isEnabled(definition, { widthMode: "hug" })).toBe(
    false,
  );
});

test("Box の height は heightMode が fixed のときのみ有効になる", () => {
  const definition = BoxSchema.props.height;
  expect(PropDefinition.isEnabled(definition, { heightMode: "fixed" })).toBe(
    true,
  );
  expect(PropDefinition.isEnabled(definition, { heightMode: "fill" })).toBe(
    false,
  );
});

test("Box の最小 / 最大は 4 つとも生リテラルの number でデフォルトを持たない", () => {
  const definitions = [
    BoxSchema.props.minWidth,
    BoxSchema.props.maxWidth,
    BoxSchema.props.minHeight,
    BoxSchema.props.maxHeight,
  ];

  for (const definition of definitions) {
    expect(PropDefinition.isLiteral(definition)).toBe(true);
    expect(definition).toMatchObject({
      domain: "literal",
      literalType: "number",
    });
    expect("default" in definition).toBe(false);
  }
});

test("Box の最小の幅は widthMode が fixed のときだけ編集できない", () => {
  const definition = BoxSchema.props.minWidth;
  expect(PropDefinition.isEnabled(definition, { widthMode: "fixed" })).toBe(
    false,
  );
  expect(PropDefinition.isEnabled(definition, { widthMode: "hug" })).toBe(true);
  expect(PropDefinition.isEnabled(definition, { widthMode: "fill" })).toBe(
    true,
  );
});

test("Box の最小の高さは heightMode が fixed のときだけ編集できない", () => {
  const definition = BoxSchema.props.minHeight;
  expect(PropDefinition.isEnabled(definition, { heightMode: "fixed" })).toBe(
    false,
  );
  expect(PropDefinition.isEnabled(definition, { heightMode: "hug" })).toBe(
    true,
  );
  expect(PropDefinition.isEnabled(definition, { heightMode: "fill" })).toBe(
    true,
  );
});

test("Box の最大の幅は widthMode が fixed のときだけ編集できない", () => {
  const definition = BoxSchema.props.maxWidth;
  expect(PropDefinition.isEnabled(definition, { widthMode: "fixed" })).toBe(
    false,
  );
  expect(PropDefinition.isEnabled(definition, { widthMode: "hug" })).toBe(true);
  expect(PropDefinition.isEnabled(definition, { widthMode: "fill" })).toBe(
    true,
  );
});

test("Box の最大の高さは heightMode が fixed のときだけ編集できない", () => {
  const definition = BoxSchema.props.maxHeight;
  expect(PropDefinition.isEnabled(definition, { heightMode: "fixed" })).toBe(
    false,
  );
  expect(PropDefinition.isEnabled(definition, { heightMode: "hug" })).toBe(
    true,
  );
  expect(PropDefinition.isEnabled(definition, { heightMode: "fill" })).toBe(
    true,
  );
});

test("Box の最小 / 最大は取りうる範囲を宣言しない", () => {
  expect("range" in BoxSchema.props.minWidth).toBe(false);
  expect("range" in BoxSchema.props.maxWidth).toBe(false);
  expect("range" in BoxSchema.props.minHeight).toBe(false);
  expect("range" in BoxSchema.props.maxHeight).toBe(false);
});

test("Box の overflow は visible / clip の enum でデフォルトが visible", () => {
  const definition = BoxSchema.props.overflow;
  expect(definition).toMatchObject({
    domain: "enum",
    values: ["visible", "clip"],
    default: "visible",
  });
});

test("Box の opacity は 0〜1 の生リテラルでデフォルトが 1", () => {
  const definition = BoxSchema.props.opacity;
  expect(PropDefinition.isLiteral(definition)).toBe(true);
  expect(definition).toMatchObject({
    domain: "literal",
    literalType: "number",
    range: { min: 0, max: 1 },
    default: 1,
  });
});

test("Box を指定するとその仕様が得られる", () => {
  expect(PrimitiveSchema.forType("Box")).toBe(BoxSchema);
});

test("Box の表示 / 非表示は visible / hidden の enum でデフォルトが visible", () => {
  const definition = BoxSchema.props.visibility;
  expect(PropDefinition.isEnum(definition)).toBe(true);
  expect(definition).toMatchObject({
    domain: "enum",
    values: ["visible", "hidden"],
    default: "visible",
  });
});

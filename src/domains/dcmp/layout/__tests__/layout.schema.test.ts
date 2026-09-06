import { expect, test } from "vitest";
import { BoxSchema, PropDefinition } from "@/domains/dcmp/primitive-schema";
import { Layout, Layouts, type Layout as LayoutType } from "../index";

/**
 * 「子を並べるか」は 2 箇所で綴られている（`Layout.direction` と、スキーマの
 * `enabledWhen`）。片方だけに配置モードを足すと、パネルは編集させるのにコンパイルが
 * 値を捨てる、という食い違いになる。それが起きないことをここで固定する。
 */
const allLayouts: readonly LayoutType[] = Object.values(Layouts);

test.each(
  allLayouts,
)("%s では間隔の編集可否と、子を並べる向きの有無が一致する", (layout) => {
  expect(PropDefinition.isEnabled(BoxSchema.props.gap, { layout })).toBe(
    Layout.direction(layout).some,
  );
});

test.each(
  allLayouts,
)("%s では揃えの編集可否と、子を並べる向きの有無が一致する", (layout) => {
  expect(PropDefinition.isEnabled(BoxSchema.props.align, { layout })).toBe(
    Layout.direction(layout).some,
  );
});

test.each(
  allLayouts,
)("%s では並べ方の編集可否と、子を並べる向きの有無が一致する", (layout) => {
  expect(PropDefinition.isEnabled(BoxSchema.props.justify, { layout })).toBe(
    Layout.direction(layout).some,
  );
});

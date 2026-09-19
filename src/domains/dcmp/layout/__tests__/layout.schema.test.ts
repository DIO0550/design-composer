import { expect, test } from "vitest";
import { BoxSchema, PropDefinition } from "@/domains/dcmp/primitive-schema";
import { Option } from "@/utils/Option";
import { Layout, Layouts, type Layout as LayoutType } from "../index";

/**
 * 「子を並べるか」は 2 箇所で綴られている（`Layout.direction` と、スキーマの
 * `enabledWhen`）。片方だけに配置モードを足すと、パネルは編集させるのにコンパイルが
 * 値を捨てる、という食い違いになる。それが起きないことをここで固定する。
 */
const allLayouts: readonly LayoutType[] = Object.values(Layouts);

/** 子を並べる Box でだけ編集できる prop と、仕様の文に出す呼び名。 */
const flexOnlyProps = [
  ["間隔", BoxSchema.props.gap],
  ["揃え", BoxSchema.props.align],
  ["並べ方", BoxSchema.props.justify],
  ["折り返し", BoxSchema.props.wrap],
] as const;

test.each(
  flexOnlyProps.flatMap(([label, definition]) =>
    allLayouts.map((layout) => [layout, label, definition] as const),
  ),
)("%s では%sの編集可否と、子を並べる向きの有無が一致する", (layout, _label, definition) => {
  expect(PropDefinition.isEnabled(definition, { layout })).toBe(
    Option.isSome(Layout.direction(layout)),
  );
});

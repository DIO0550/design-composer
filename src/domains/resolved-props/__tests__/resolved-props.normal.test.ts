import { expect, expectTypeOf, test } from "vitest";
import type { PropValue } from "@/domains/node";
import { ResolvedProps } from "../index";

test("未指定の direction はスキーマのデフォルト値 column に解決される", () => {
  const resolved = ResolvedProps.resolve("Box", {});
  expect(resolved.direction).toBe("column");
});

test("指定済みの direction は保存された値のまま解決される", () => {
  const resolved = ResolvedProps.resolve("Box", { direction: "row" });
  expect(resolved.direction).toBe("row");
});

test("複数の未指定 prop に一括でデフォルト値が補完される", () => {
  const resolved = ResolvedProps.resolve("Box", {});
  expect(resolved).toMatchObject({
    direction: "column",
    align: "stretch",
    justify: "start",
    widthMode: "hug",
    heightMode: "hug",
    overflow: "visible",
  });
});

test("未指定の typography はデフォルトのトークン名 body にそのまま解決される", () => {
  const resolved = ResolvedProps.resolve("Text", {});
  expect(resolved.typography).toBe("body");
});

test("未指定の color はデフォルトのトークン名 gray-900 にそのまま解決される", () => {
  const resolved = ResolvedProps.resolve("Text", {});
  expect(resolved.color).toBe("gray-900");
});

test("forNode に渡した props が省略されたノードもデフォルトで解決される", () => {
  const node = { name: "label-1", type: "Text" as const };
  const resolved = ResolvedProps.forNode(node);
  expect(resolved).toMatchObject({ content: "", typography: "body" });
});

test("解決済み props はデフォルトを持つ prop の存在が型レベルで保証される", () => {
  const resolved = ResolvedProps.resolve("Box", {});
  expectTypeOf(resolved).toExtend<
    Readonly<Record<"direction" | "align" | "justify" | "overflow", PropValue>>
  >();
  expect(resolved.direction).toBe("column");
});

test("forNode は node.type のスキーマに基づいて解決する", () => {
  const node = {
    name: "box-1",
    type: "Box" as const,
    props: { direction: "row" as const },
  };
  const resolved = ResolvedProps.forNode(node);
  expect(resolved).toMatchObject({ direction: "row", align: "stretch" });
});

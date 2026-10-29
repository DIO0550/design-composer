import { expect, expectTypeOf, test } from "vitest";
import { PropEdit } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";
import { Layout, Layouts } from "../index";

test("配置モードの語彙は free / row / column の 3 つに閉じている", () => {
  expectTypeOf<Layout>().toEqualTypeOf<"free" | "row" | "column">();
});

test("未指定のときは既定の column として扱われる", () => {
  expect(Layout.fromProps({})).toBe("column");
});

test("語彙に無い綴りは既定の column として扱われる", () => {
  expect(Layout.fromProps({ layout: "diagonal" })).toBe("column");
});

test("row を指定すると横並びの配置モードになる", () => {
  expect(Layout.fromProps({ layout: "row" })).toBe("row");
});

test("横並びの配置モードは子を row の向きに並べる", () => {
  expect(Layout.direction("row")).toEqual(Option.some("row"));
});

test("自由配置の配置モードは子を並べる向きを持たない", () => {
  expect(Layout.direction(Layouts.Free)).toEqual(Option.none);
});

test("選択肢の並びは row / column / free の順になる", () => {
  expect(Object.values(Layouts)).toEqual(["row", "column", "free"]);
});

test("書かれている layout と gap だけを、同じ値で書く編集になる", () => {
  expect([
    Layout.collectWrittenPropEdits({ layout: "row", gap: "md", align: "end" }),
    Layout.collectWrittenPropEdits({ align: "end" }),
  ]).toEqual([
    [PropEdit.set(["layout"], "row"), PropEdit.set(["gap"], "md")],
    [],
  ]);
});

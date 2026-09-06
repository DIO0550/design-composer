import { expect, test } from "vitest";
import { Layout, Layouts } from "../index";

test("縦並びの配置モードは flex コンテナと向きの宣言をこの順で出す", () => {
  expect(Layout.declarations("column")).toEqual([
    { property: "display", value: "flex" },
    { property: "flex-direction", value: "column" },
  ]);
});

test("横並びの配置モードは向きの宣言が row になる", () => {
  expect(Layout.declarations("row")).toEqual([
    { property: "display", value: "flex" },
    { property: "flex-direction", value: "row" },
  ]);
});

test("自由配置の配置モードは flex コンテナにしないので宣言を出さない", () => {
  expect(Layout.declarations(Layouts.Free)).toEqual([]);
});

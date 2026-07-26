import { expect, expectTypeOf, test } from "vitest";
import { CssDirection } from "../index";

test("CssDirection は Box スキーマの direction が取り得る値と一致する", () => {
  expectTypeOf<CssDirection>().toEqualTypeOf<"row" | "column">();
});

test("direction の値から向きが決まる", () => {
  expect(CssDirection.from("row")).toBe("row");
  expect(CssDirection.from("column")).toBe("column");
});

test("未指定のときはスキーマのデフォルトの向きになる", () => {
  expect(CssDirection.from(undefined)).toBe("column");
});

test("横並びのとき幅は主軸・高さは交差軸になる", () => {
  expect(CssDirection.isMainAxis("row", "width")).toBe(true);
  expect(CssDirection.isMainAxis("row", "height")).toBe(false);
});

test("縦並びのとき高さは主軸・幅は交差軸になる", () => {
  expect(CssDirection.isMainAxis("column", "height")).toBe(true);
  expect(CssDirection.isMainAxis("column", "width")).toBe(false);
});

test("主軸方向に広がる指定は伸長の宣言になる", () => {
  expect(CssDirection.fillDeclaration("row", "width")).toEqual({
    property: "flex-grow",
    value: "1",
  });
});

test("交差軸方向に広がる指定は引き伸ばしの宣言になる", () => {
  expect(CssDirection.fillDeclaration("row", "height")).toEqual({
    property: "align-self",
    value: "stretch",
  });
});

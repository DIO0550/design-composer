import { expect, test } from "vitest";
import { CssDeclaration } from "@/domains/dcmp/css-declaration";
import { Visibility } from "../index";

test("表示 / 非表示を書いていないノードは表示として読まれる", () => {
  expect(Visibility.fromProps({})).toBe("visible");
});

test("非表示と書いたノードは非表示として読まれる", () => {
  expect(Visibility.fromProps({ visibility: "hidden" })).toBe("hidden");
});

test("非表示のノードは描画から外す宣言 1 件になる", () => {
  expect(Visibility.declarations("hidden")).toEqual([
    CssDeclaration.create("display", "none"),
  ]);
});

test("表示のままのノードは宣言を出さない", () => {
  expect(Visibility.declarations("visible")).toEqual([]);
});

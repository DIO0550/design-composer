import { expect, test } from "vitest";
import { setupBoxStyle, setupTextStyle } from "./element-style-setup";

test("非表示の Box は子を並べる指定より非表示が勝つ", () => {
  expect(
    setupBoxStyle({ layout: "column", visibility: "hidden" }).display,
  ).toBe("none");
});

test("表示のままの Box は子を並べる指定がそのまま残る", () => {
  expect(setupBoxStyle({ layout: "column" }).display).toBe("flex");
});

test("子を並べない Box も非表示にすると描画から外れる", () => {
  expect(setupBoxStyle({ layout: "free", visibility: "hidden" }).display).toBe(
    "none",
  );
});

test("非表示の Text は描画から外れる", () => {
  expect(setupTextStyle({ visibility: "hidden" }).display).toBe("none");
});

test("表示のままの Text は描画から外す宣言を持たない", () => {
  expect("display" in setupTextStyle({})).toBe(false);
});

import { expect, test } from "vitest";
import { ColorToken } from "../index";

test("大文字で書かれた hex カラーは小文字に正規化される", () => {
  expect(ColorToken.normalize("#3B82F6")).toBe("#3b82f6");
});

test("alpha 付きの hex カラーも小文字に正規化される", () => {
  expect(ColorToken.normalize("#0000001A")).toBe("#0000001a");
});

test("すでに小文字の hex カラーは変わらない", () => {
  expect(ColorToken.normalize("#3b82f6")).toBe("#3b82f6");
});

test("hex として読めない値は正規化されずそのまま返る", () => {
  expect(ColorToken.normalize("RED")).toBe("RED");
});

test("正規化した色は有効な色として判定される", () => {
  expect(ColorToken.isValid(ColorToken.normalize("#3B82F6"))).toBe(true);
});

test.each([
  "#3b82f6",
  "#111827",
  "#0000001a",
  "#ffffffff",
])("hex カラー %s は有効な色として判定される", (value) => {
  expect(ColorToken.isValid(value)).toBe(true);
});

test("色の RGB を差し替えても alpha は引き継がれる", () => {
  expect(ColorToken.withRgb("#00000026", "#ff0000")).toBe("#ff000026");
});

test("alpha を持たない色の RGB を差し替えると alpha は付かない", () => {
  expect(ColorToken.withRgb("#3b82f6", "#00ff00")).toBe("#00ff00");
});

test("差し替えた RGB は小文字へ正規化される", () => {
  expect(ColorToken.withRgb("#0000001a", "#AABBCC")).toBe("#aabbcc1a");
});

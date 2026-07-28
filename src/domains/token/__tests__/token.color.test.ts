import { expect, test } from "vitest";
import { TokenSet } from "../index";

test("大文字で書かれた hex カラーは小文字に正規化される", () => {
  expect(TokenSet.normalizeColor("#3B82F6")).toBe("#3b82f6");
});

test("alpha 付きの hex カラーも小文字に正規化される", () => {
  expect(TokenSet.normalizeColor("#0000001A")).toBe("#0000001a");
});

test("すでに小文字の hex カラーは変わらない", () => {
  expect(TokenSet.normalizeColor("#3b82f6")).toBe("#3b82f6");
});

test("hex として読めない値は正規化されずそのまま返る", () => {
  expect(TokenSet.normalizeColor("RED")).toBe("RED");
});

test("正規化した色は有効な色として判定される", () => {
  expect(TokenSet.isValidColor(TokenSet.normalizeColor("#3B82F6"))).toBe(true);
});

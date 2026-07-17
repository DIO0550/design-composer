import { expect, test } from "vitest";
import { TokenSet } from "../token";

test.each([
  "#fff",
  "#12345",
  "3b82f6",
  "rgb(59, 130, 246)",
  "blue",
])("hex カラーでない値 %s は無効な色として判定される", (value) => {
  expect(TokenSet.isValidColor(value)).toBe(false);
});

test("存在しないトークン名を has で確認すると false になる", () => {
  expect(TokenSet.has(TokenSet.empty(), "colors", "primary")).toBe(false);
});

import { expect, test } from "vitest";
import { ColorToken } from "../index";

test.each([
  "#fff",
  "#12345",
  "3b82f6",
  "rgb(59, 130, 246)",
  "blue",
])("hex カラーでない値 %s は無効な色として判定される", (value) => {
  expect(ColorToken.isValid(value)).toBe(false);
});

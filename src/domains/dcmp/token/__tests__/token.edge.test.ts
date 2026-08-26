import { expect, test } from "vitest";
import { TokenSet } from "../index";

test("存在しないトークン名を has で確認すると false になる", () => {
  expect(TokenSet.has(TokenSet.empty(), "colors", "primary")).toBe(false);
});

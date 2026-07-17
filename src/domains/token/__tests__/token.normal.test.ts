import { expect, test } from "vitest";
import { TokenSet } from "../index";

test("空の TokenSet を作成すると全種別が空オブジェクトになる", () => {
  expect(TokenSet.empty()).toEqual({
    colors: {},
    spacing: {},
    radius: {},
    shadows: {},
    typography: {},
  });
});

test.each([
  "#3b82f6",
  "#111827",
  "#0000001a",
  "#ffffffff",
])("hex カラー %s は有効な色として判定される", (value) => {
  expect(TokenSet.isValidColor(value)).toBe(true);
});

test("存在するトークン名を has で確認すると true になる", () => {
  const tokens = TokenSet.empty();
  const withColor = { ...tokens, colors: { primary: "#3b82f6" } };
  expect(TokenSet.has(withColor, "colors", "primary")).toBe(true);
});

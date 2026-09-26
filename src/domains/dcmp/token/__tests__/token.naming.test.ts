import { expect, test } from "vitest";
import { TokenSet } from "../index";

test("その種別で使われていない名前はそのまま使える", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    colors: { brand: "#000000" },
  };

  expect(TokenSet.uniqueName(tokens, "colors", "color")).toBe("color");
});

test("同じ種別に同名があれば連番が付く", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    colors: { color: "#000000" },
  };

  expect(TokenSet.uniqueName(tokens, "colors", "color")).toBe("color-2");
});

test("連番の名前も使われていればさらに次の連番が付く", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    colors: { color: "#000000", "color-2": "#ffffff" },
  };

  expect(TokenSet.uniqueName(tokens, "colors", "color")).toBe("color-3");
});

test("別の種別にある同名とは衝突しない", () => {
  const tokens: TokenSet = { ...TokenSet.empty(), spacing: { color: 8 } };

  expect(TokenSet.uniqueName(tokens, "colors", "color")).toBe("color");
});

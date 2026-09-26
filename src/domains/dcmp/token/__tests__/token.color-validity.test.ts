import { expect, test } from "vitest";
import { TokenSet } from "../index";

test("正規形の hex でない色の名前だけが colors の並び順で集まる", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    colors: { brand: "red", primary: "#3b82f6", accent: "#3B82F6" },
  };

  expect(TokenSet.collectInvalidColorNames(tokens)).toEqual([
    "brand",
    "accent",
  ]);
});

test("影の中の hex でない色は、不正な色の名前に含まれない", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    shadows: { sm: { x: 0, y: 1, blur: 3, color: "red" } },
  };

  expect(TokenSet.collectInvalidColorNames(tokens)).toEqual([]);
});

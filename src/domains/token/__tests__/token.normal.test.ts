import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
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

test("存在するトークン名を has で確認すると true になる", () => {
  const tokens = TokenSet.empty();
  const withColor = { ...tokens, colors: { primary: "#3b82f6" } };
  expect(TokenSet.has(withColor, "colors", "primary")).toBe(true);
});

test("色は findColor で名前から引ける", () => {
  const tokens = { ...TokenSet.empty(), colors: { primary: "#3b82f6" } };

  expect(TokenSet.findColor(tokens, "primary")).toEqual(Option.some("#3b82f6"));
});

test("色に無い名前を findColor で引くと不在になる", () => {
  /* 同じ名前が別の種別にあっても色としては引けない（種別の中だけで一意 / docs/04-tokens.md）。 */
  const tokens = { ...TokenSet.empty(), spacing: { md: 16 } };

  expect(TokenSet.findColor(tokens, "md")).toEqual(Option.none);
});

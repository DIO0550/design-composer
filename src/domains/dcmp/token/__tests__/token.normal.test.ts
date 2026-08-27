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

test("数値のトークンは findNumber で種別と名前から引ける", () => {
  /*
   * spacing と radius に同じ名前を置いてある。種別を無視して引く実装にすると
   * 先に見つかったほうが返って落ちる（同名が無いと、壊しても同じ答えになる）。
   */
  const tokens = {
    ...TokenSet.empty(),
    spacing: { md: 16 },
    radius: { md: 8 },
  };

  expect(TokenSet.findNumber(tokens, "radius", "md")).toEqual(Option.some(8));
});

test("その種別に無い名前を findNumber で引くと不在になる", () => {
  const tokens = { ...TokenSet.empty(), spacing: { md: 16 } };

  expect(TokenSet.findNumber(tokens, "radius", "md")).toEqual(Option.none);
});

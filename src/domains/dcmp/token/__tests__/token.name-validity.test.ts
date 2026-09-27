import { expect, test } from "vitest";
import { TokenSet } from "../index";

test("名前がすべてトークン名の規則を満たすときは何も返さない", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    colors: { "brand-primary": "#112233" },
    spacing: { md: 8 },
  };

  expect(TokenSet.collectInvalidNameRefs(tokens)).toEqual([]);
});

test("規則を満たさない名前は種別と名前の対で返る", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    colors: { primary: "#112233", Accent: "#445566" },
  };

  expect(TokenSet.collectInvalidNameRefs(tokens)).toEqual([
    { kind: "colors", name: "Accent" },
  ]);
});

test("複数の種別にある違反は、辞書に書いた順ではなく種別の並び順に並ぶ", () => {
  const tokens: TokenSet = {
    gradients: {},
    spacing: { Large: 16 },
    radius: {},
    shadows: {},
    typography: {},
    colors: { Primary: "#112233" },
  };

  expect(TokenSet.collectInvalidNameRefs(tokens)).toEqual([
    { kind: "colors", name: "Primary" },
    { kind: "spacing", name: "Large" },
  ]);
});

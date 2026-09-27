import { expect, test } from "vitest";
import { Fade } from "@/domains/__tests__/gradient-tokens";
import { TokenSet } from "../index";

test("識別子の規則を満たさないトークン名が、種別の順・種別の中の並び順で種別と名前の対として集まる", () => {
  // 種別の順（spacing → gradients）と種別の中の並び（Zeta → Alpha）は、どちらも辞書順と逆にしている
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    colors: { primary: "#3b82f6" },
    spacing: { Zeta: 4, md: 8, Alpha: 16 },
    gradients: { Fade },
  };

  expect(TokenSet.collectInvalidNameRefs(tokens)).toEqual([
    { kind: "spacing", name: "Zeta" },
    { kind: "spacing", name: "Alpha" },
    { kind: "gradients", name: "Fade" },
  ]);
});

test("識別子の規則を満たすトークン名だけなら何も集まらない", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    colors: { primary: "#3b82f6" },
    spacing: { md: 8 },
    gradients: { fade: Fade },
  };

  expect(TokenSet.collectInvalidNameRefs(tokens)).toEqual([]);
});

import { expect, test } from "vitest";
import { Fade } from "@/domains/__tests__/gradient-tokens";
import type { TokenSet } from "@/domains/dcmp/token";
import { TokenSet as TokenSetCompanion } from "@/domains/dcmp/token";
import { TokenCss } from "../index";

/**
 * 塗りの名前がどの種別にあるかだけを変えたトークン一式。
 *
 * 解決そのものの仕様は `token.paint-name` が持つ。ここで見るのは、渡したトークン一式に
 * 束縛されているか（綴り方だけを返して解決を無視していないか）。
 */
function setupTokens(): TokenSet {
  return {
    ...TokenSetCompanion.empty(),
    colors: { primary: "#3b82f6" },
    gradients: { brand: Fade },
    spacing: { md: 16 },
  };
}

test("渡したトークン一式の gradients にある名前は gradients が持っていると答える", () => {
  expect(TokenCss.refsFrom(setupTokens()).paintResolution("brand")).toEqual({
    state: "owned",
    tokenKind: "gradients",
  });
});

test("渡したトークン一式の塗りに無い名前は宙に浮くと答える", () => {
  // 入力は spacing に実在する名前。トークン一式を無視する実装ならここで owned になる
  expect(TokenCss.refsFrom(setupTokens()).paintResolution("md")).toEqual({
    state: "dangling",
  });
});

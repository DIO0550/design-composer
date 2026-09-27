import { expect, test } from "vitest";
import type { GradientToken, TokenSet } from "@/domains/dcmp/token";
import { TokenSet as TokenSetOf } from "@/domains/dcmp/token";
import { TokenCss } from "../index";

/** 名前の解決だけを見たいので、階調の中身は最小の 2 stop にする。 */
const Brand: GradientToken = {
  shape: "linear",
  angle: 90,
  stops: [
    { color: "#3b82f6", ratio: 0 },
    { color: "#1d4ed8", ratio: 1 },
  ],
};

function setupTokens(): TokenSet {
  return {
    ...TokenSetOf.empty(),
    colors: { primary: "#3b82f6", both: "#111827" },
    gradients: { brand: Brand, both: Brand },
    spacing: { md: 16 },
  };
}

test("colors だけが持つ名前は colors が持っていると答える", () => {
  expect(TokenCss.refsFrom(setupTokens()).paintResolution("primary")).toEqual({
    kind: "owned",
    tokenKind: "colors",
  });
});

test("gradients だけが持つ名前は gradients が持っていると答える", () => {
  expect(TokenCss.refsFrom(setupTokens()).paintResolution("brand")).toEqual({
    kind: "owned",
    tokenKind: "gradients",
  });
});

test("両方の種別が持つ名前はどちらが持っているか決まらないと答える", () => {
  expect(TokenCss.refsFrom(setupTokens()).paintResolution("both")).toEqual({
    kind: "conflicted",
  });
});

test("塗りのどちらの種別も持っていない名前は宙に浮くと答える", () => {
  // 入力は spacing に実在する名前。渡したトークン一式を無視する実装ならここで owned になる
  expect(TokenCss.refsFrom(setupTokens()).paintResolution("md")).toEqual({
    kind: "dangling",
  });
});

import { expect, test } from "vitest";
import type { GradientToken } from "@/domains/dcmp/token";
import { TokenSet } from "@/domains/dcmp/token";
import {
  setupBoxStyle,
  setupBoxStyleWithTokens,
  setupTextStyle,
} from "./element-style-setup";

/** 名前の衝突だけを見たいので、階調の中身は最小の 2 stop にする。 */
const Brand: GradientToken = {
  shape: "linear",
  angle: 90,
  stops: [
    { color: "#3b82f6", ratio: 0 },
    { color: "#1d4ed8", ratio: 1 },
  ],
};

test("トークン参照 prop はトークンの値ではなく var() 参照になる", () => {
  expect(setupBoxStyle({ gap: "md" }).gap).toBe("var(--spacing-md)");
});

test("未指定のトークン参照 prop は宣言を出力しない", () => {
  expect("background" in setupBoxStyle({})).toBe(false);
});

test("トークン参照 prop の値は仕様で定めたトークン種別から引かれる", () => {
  const style = setupBoxStyle({
    background: "primary",
    radiusTopLeft: "lg",
    shadow: "sm",
  });

  expect(style).toMatchObject({
    background: "var(--colors-primary)",
    "border-radius": "var(--radius-lg) 0 0 0",
    "box-shadow": "var(--shadows-sm)",
  });
});

test("Text の色もトークン参照になる", () => {
  expect(setupTextStyle({ color: "primary" }).color).toBe(
    "var(--colors-primary)",
  );
});

test("gradients だけが持つ名前を指す背景は gradients の var になる", () => {
  expect(setupBoxStyle({ background: "brand" }).background).toBe(
    "var(--gradients-brand)",
  );
});

test("塗りの 2 種別が同じ名前を持つとき背景の宣言を出さない", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    colors: { brand: "#3b82f6" },
    gradients: { brand: Brand },
    spacing: { md: 16 },
  };

  const style = setupBoxStyleWithTokens(
    { background: "brand", gap: "md" },
    tokens,
  );

  // 同じノードの gap を対照に置く。宣言の数だけを見ると、組み立てが丸ごと壊れても通る
  expect(style.gap).toBe("var(--spacing-md)");
  expect("background" in style).toBe(false);
});

test("どちらの種別も持っていない名前を指す背景は colors の var になる", () => {
  expect(setupBoxStyle({ background: "nope" }).background).toBe(
    "var(--colors-nope)",
  );
});

test("塗りに同名があっても塗り以外の prop は巻き込まれない", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    colors: { sm: "#3b82f6" },
    gradients: { sm: Brand },
    shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0000001a" } },
  };

  expect(setupBoxStyleWithTokens({ shadow: "sm" }, tokens)["box-shadow"]).toBe(
    "var(--shadows-sm)",
  );
});

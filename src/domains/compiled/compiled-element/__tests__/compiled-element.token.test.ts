import { expect, test } from "vitest";
import { Fade } from "@/domains/__tests__/gradient-tokens";
import { TokenSet } from "@/domains/dcmp/token";
import { setupBoxStyle, setupTextStyle } from "./element-style-setup";

/** 塗りの解決だけを見るトークン一式。名前がどちらの種別にあるかだけを変えて使う。 */
function setupPaintTokens(): TokenSet {
  return {
    ...TokenSet.empty(),
    colors: { plain: "#3b82f6", both: "#111827" },
    gradients: { brand: Fade, both: Fade },
    spacing: { md: 16 },
    shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0000001a" } },
  };
}

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
  const style = setupBoxStyle(
    { background: "brand" },
    { tokens: setupPaintTokens() },
  );

  expect(style.background).toBe("var(--gradients-brand)");
});

test("colors だけが持つ名前を指す背景は colors の var になる", () => {
  const style = setupBoxStyle(
    { background: "plain" },
    { tokens: setupPaintTokens() },
  );

  expect(style.background).toBe("var(--colors-plain)");
});

test("塗りの 2 種別が同じ名前を持つとき背景の宣言を出さない", () => {
  const style = setupBoxStyle(
    { background: "both", gap: "md" },
    { tokens: setupPaintTokens() },
  );

  // 同じノードの gap を対照に置く。宣言の数だけを見ると、組み立てが丸ごと壊れても通る
  expect(style.gap).toBe("var(--spacing-md)");
  expect("background" in style).toBe(false);
});

test("どちらの種別も持っていない名前を指す背景は colors の var になる", () => {
  const style = setupBoxStyle(
    { background: "md" },
    { tokens: setupPaintTokens() },
  );

  // 入力は spacing に実在する名前。塗り以外の種別まで見る実装ならここで gradients になる
  expect(style.background).toBe("var(--colors-md)");
});

test("塗りに同名があっても塗り以外の prop は巻き込まれない", () => {
  const style = setupBoxStyle(
    { background: "both", shadow: "sm" },
    { tokens: setupPaintTokens() },
  );

  expect(style["box-shadow"]).toBe("var(--shadows-sm)");
});

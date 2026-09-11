import { expect, test } from "vitest";
import { setupBoxStyle, setupTextStyle } from "./element-style-setup";

test("トークン参照 prop はトークンの値ではなく var() 参照になる", () => {
  expect(setupBoxStyle({ gap: "md" }).gap).toBe("var(--spacing-md)");
});

test("未指定のトークン参照 prop は宣言を出力しない", () => {
  expect("background" in setupBoxStyle({})).toBe(false);
});

test("トークン参照 prop の値は仕様で定めたトークン種別から引かれる", () => {
  const style = setupBoxStyle({
    background: "primary",
    radius: "lg",
    shadow: "sm",
  });

  expect(style).toMatchObject({
    background: "var(--colors-primary)",
    "border-radius": "var(--radius-lg)",
    "box-shadow": "var(--shadows-sm)",
  });
});

test("Text の色もトークン参照になる", () => {
  expect(setupTextStyle({ color: "primary" }).color).toBe(
    "var(--colors-primary)",
  );
});

import { expect, test } from "vitest";
import { LengthShorthand } from "@/domains/dcmp/length-shorthand";
import { CornerRadius } from "../index";

/**
 * radius トークン名を CSS の長さへ変換する手段。
 *
 * @param token 変換するトークン名
 * @returns そのトークンを指す `var()` 参照
 */
function radiusRef(token: string): string {
  return `var(--radius-${token})`;
}

/**
 * その角丸が出す `border-radius` の値。
 *
 * @param radius 合成する角丸
 * @returns 左上 右上 右下 左下 の順に連ねた 4 値
 */
function cssValueOf(radius: CornerRadius): string {
  return LengthShorthand.cssValue(
    CornerRadius.toLengthShorthand(radius),
    radiusRef,
  );
}

test("4隅を指定した角丸は 左上 右上 右下 左下 の順で合成される", () => {
  const radius = {
    topLeft: "sm",
    topRight: "md",
    bottomRight: "lg",
    bottomLeft: "full",
  };

  expect(cssValueOf(radius)).toBe(
    "var(--radius-sm) var(--radius-md) var(--radius-lg) var(--radius-full)",
  );
});

test("左上だけを指定すると残りの3隅は 0 になる", () => {
  expect(cssValueOf({ topLeft: "md" })).toBe("var(--radius-md) 0 0 0");
});

test("右下だけを指定すると残りの3隅は 0 になる", () => {
  expect(cssValueOf({ bottomRight: "lg" })).toBe("0 0 var(--radius-lg) 0");
});

test("角丸は border-radius プロパティへ合成される", () => {
  expect(CornerRadius.toLengthShorthand({ topLeft: "md" }).property).toBe(
    "border-radius",
  );
});

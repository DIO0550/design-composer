import { expect, test } from "vitest";
import { LengthShorthand } from "@/domains/dcmp/length-shorthand";
import { Padding } from "../index";

/**
 * spacing トークン名を CSS の長さへ変換する手段。
 *
 * @param token 変換するトークン名
 * @returns そのトークンを指す `var()` 参照
 */
function spacingRef(token: string): string {
  return `var(--spacing-${token})`;
}

/**
 * そのパディングが出す `padding` の値。
 *
 * @param padding 合成するパディング
 * @returns 上 右 下 左 の順に連ねた 4 値
 */
function cssValueOf(padding: Padding): string {
  return LengthShorthand.cssValue(
    Padding.toLengthShorthand(padding),
    spacingRef,
  );
}

test("4辺を指定したパディングは 上 右 下 左 の順で合成される", () => {
  const padding = { top: "xs", right: "sm", bottom: "md", left: "lg" };

  expect(cssValueOf(padding)).toBe(
    "var(--spacing-xs) var(--spacing-sm) var(--spacing-md) var(--spacing-lg)",
  );
});

test("下だけを指定すると残りの3辺は 0 になる", () => {
  expect(cssValueOf({ bottom: "lg" })).toBe("0 0 var(--spacing-lg) 0");
});

test("右だけを指定すると残りの3辺は 0 になる", () => {
  expect(cssValueOf({ right: "sm" })).toBe("0 var(--spacing-sm) 0 0");
});

test("左右だけを指定すると上下は 0 になる", () => {
  expect(cssValueOf({ right: "lg", left: "lg" })).toBe(
    "0 var(--spacing-lg) 0 var(--spacing-lg)",
  );
});

test("同じ辺に同じトークンを指定すれば同じ値になる", () => {
  const padding = { top: "md", right: "md", bottom: "md", left: "md" };

  expect(cssValueOf(padding)).toBe(
    "var(--spacing-md) var(--spacing-md) var(--spacing-md) var(--spacing-md)",
  );
});

test("パディングは padding プロパティへ合成される", () => {
  expect(Padding.toLengthShorthand({ top: "md" }).property).toBe("padding");
});

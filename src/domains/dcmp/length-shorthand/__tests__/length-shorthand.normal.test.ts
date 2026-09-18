import { expect, test } from "vitest";
import { LengthShorthand } from "../index";

/**
 * トークン名を CSS の長さへ変換する手段。合成の規則は位置の語彙にも種別にも依らないので、
 * padding / radius のどちらでもない綴りで確かめる。
 *
 * @param token 変換するトークン名
 * @returns そのトークンを指す `var()` 参照
 */
function tokenRef(token: string): string {
  return `var(--len-${token})`;
}

test("すべての位置が指定されていれば宣言順のまま 4 値に合成される", () => {
  const shorthand = LengthShorthand.create("padding", ["xs", "sm", "md", "lg"]);

  expect(LengthShorthand.cssValue(shorthand, tokenRef)).toBe(
    "var(--len-xs) var(--len-sm) var(--len-md) var(--len-lg)",
  );
});

test("未指定の位置は 0 になり、指定した位置だけがトークンを参照する", () => {
  const shorthand = LengthShorthand.create("padding", [
    undefined,
    "sm",
    undefined,
    undefined,
  ]);

  expect(LengthShorthand.cssValue(shorthand, tokenRef)).toBe(
    "0 var(--len-sm) 0 0",
  );
});

test("1 つも指定が無い並びは空である", () => {
  const shorthand = LengthShorthand.create("padding", [
    undefined,
    undefined,
    undefined,
    undefined,
  ]);

  expect(LengthShorthand.isEmpty(shorthand)).toBe(true);
});

test("1 つでも指定があれば空ではない", () => {
  const shorthand = LengthShorthand.create("padding", [
    undefined,
    undefined,
    undefined,
    "lg",
  ]);

  expect(LengthShorthand.isEmpty(shorthand)).toBe(false);
});

test("1 つも指定が無ければ宣言を出さない", () => {
  const shorthand = LengthShorthand.create("border-radius", [
    undefined,
    undefined,
    undefined,
    undefined,
  ]);

  expect(LengthShorthand.declarations(shorthand, tokenRef)).toEqual([]);
});

test("1 つでも指定があれば合成した宣言を 1 件出す", () => {
  const shorthand = LengthShorthand.create("padding", [
    "md",
    undefined,
    undefined,
    undefined,
  ]);

  expect(LengthShorthand.declarations(shorthand, tokenRef)).toEqual([
    { property: "padding", value: "var(--len-md) 0 0 0" },
  ]);
});

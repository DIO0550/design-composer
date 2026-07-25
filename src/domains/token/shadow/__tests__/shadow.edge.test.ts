import { expect, test } from "vitest";
import { ShadowToken } from "../index";

test("spread を省略すると 0 として扱われる", () => {
  const shadow = { x: 0, y: 1, blur: 3, color: "#0000001a" };

  expect(ShadowToken.spreadOf(shadow)).toBe(0);
});

test("spread を省略した影の box-shadow 値には 0px が入る", () => {
  const shadow = { x: 0, y: 1, blur: 3, color: "#0000001a" };

  expect(ShadowToken.cssValue(shadow)).toBe("0px 1px 3px 0px #0000001a");
});

test("負のオフセットは符号付きの px として出力される", () => {
  const shadow = { x: -2, y: -4, blur: 8, spread: -1, color: "#00000033" };

  expect(ShadowToken.cssValue(shadow)).toBe("-2px -4px 8px -1px #00000033");
});

test("小数のぼかしは小数のまま px 化される", () => {
  const shadow = { x: 0, y: 0, blur: 2.5, color: "#0000001a" };

  expect(ShadowToken.cssValue(shadow)).toBe("0px 0px 2.5px 0px #0000001a");
});

test("alpha 付きの色はそのまま box-shadow 値の末尾に入る", () => {
  const shadow = { x: 0, y: 1, blur: 3, color: "#0000001a" };

  expect(ShadowToken.cssValue(shadow).endsWith("#0000001a")).toBe(true);
});

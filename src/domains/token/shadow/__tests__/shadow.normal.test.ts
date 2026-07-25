import { expect, test } from "vitest";
import { ShadowToken } from "../index";

test("影は x / y / blur / spread / color を並べた box-shadow 値になる", () => {
  const shadow = { x: 0, y: 4, blur: 12, spread: 2, color: "#00000026" };

  expect(ShadowToken.cssValue(shadow)).toBe("0px 4px 12px 2px #00000026");
});

test("オフセットとぼかしは px 単位付きで出力される", () => {
  const shadow = { x: 1, y: 8, blur: 24, spread: 0, color: "#00000033" };

  expect(ShadowToken.cssValue(shadow)).toBe("1px 8px 24px 0px #00000033");
});

test("spread を指定するとその値が使われる", () => {
  const shadow = { x: 0, y: 1, blur: 3, spread: 5, color: "#0000001a" };

  expect(ShadowToken.spreadOf(shadow)).toBe(5);
});

import { expect, test } from "vitest";
import { Font } from "../Font";

test("システムフォントスタックは system-ui から始まる", () => {
  expect(Font.systemStack().startsWith("system-ui")).toBe(true);
});

test("システムフォントスタックは総称フォントで終わる", () => {
  expect(Font.systemStack().endsWith("sans-serif")).toBe(true);
});

test("システムフォントスタックは何度取得しても同じ値になる", () => {
  expect(Font.systemStack()).toBe(Font.systemStack());
});

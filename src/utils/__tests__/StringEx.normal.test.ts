import { expect, test } from "vitest";
import { StringEx } from "../StringEx";

test("半角スペースは空白文字として true になる", () => {
  expect(StringEx.isWhitespace(" ")).toBe(true);
});

test("タブ・改行・復帰も空白文字として true になる", () => {
  expect(StringEx.isWhitespace("\t")).toBe(true);
  expect(StringEx.isWhitespace("\n")).toBe(true);
  expect(StringEx.isWhitespace("\r")).toBe(true);
});

test("空白ではない文字は空白文字として false になる", () => {
  expect(StringEx.isWhitespace("a")).toBe(false);
});

test("0から9の数字は数字として true になる", () => {
  expect(StringEx.isDigit("0")).toBe(true);
  expect(StringEx.isDigit("9")).toBe(true);
});

test("数字ではない文字は数字として false になる", () => {
  expect(StringEx.isDigit("a")).toBe(false);
});

test("camelCase の識別子は語の切れ目で分かれ、先頭が大文字のラベルになる", () => {
  expect(StringEx.toLabel("widthMode")).toBe("Width Mode");
});

test("大文字1文字の語も独立した語として分かれる", () => {
  expect(StringEx.toLabel("paddingX")).toBe("Padding X");
});

test("切れ目の無い識別子は先頭が大文字になるだけ", () => {
  expect(StringEx.toLabel("content")).toBe("Content");
});

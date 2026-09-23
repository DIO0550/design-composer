import { expect, test } from "vitest";
import { StringEx } from "../StringEx";

test("2 文字以上の数字の並びは数字 1 文字として false になる", () => {
  expect(StringEx.isDigit("10")).toBe(false);
});

test("数字で始まる 2 文字以上の文字列は数字 1 文字として false になる", () => {
  expect(StringEx.isDigit("5abc")).toBe(false);
});

test("空文字は数字 1 文字として false になる", () => {
  expect(StringEx.isDigit("")).toBe(false);
});

test("2 文字以上の空白の並びは空白 1 文字として false になる", () => {
  expect(StringEx.isWhitespace("  ")).toBe(false);
});

test("空文字は空白 1 文字として false になる", () => {
  expect(StringEx.isWhitespace("")).toBe(false);
});

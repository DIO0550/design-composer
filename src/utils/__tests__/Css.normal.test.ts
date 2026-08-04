import { expect, test } from "vitest";
import { Css } from "@/utils/Css";

test("記号を含まない文字列はそのまま", () => {
  expect(Css.escapeQuotedString("home-title")).toBe("home-title");
});

test("二重引用符は文字列を閉じないように escape される", () => {
  expect(Css.escapeQuotedString('a"b')).toBe('a\\"b');
});

test("バックスラッシュは escape の記号として読まれないように escape される", () => {
  expect(Css.escapeQuotedString("a\\b")).toBe("a\\\\b");
});

test("escape 済みに見える文字列も二重に読まれない形になる", () => {
  expect(Css.escapeQuotedString('a\\"b')).toBe('a\\\\\\"b');
});

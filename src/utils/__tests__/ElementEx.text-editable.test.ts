import { expect, test } from "vitest";
import { ElementEx } from "../ElementEx";

test("入力欄は文字を打ち込める場所として扱う", () => {
  expect(ElementEx.isTextEditable(document.createElement("input"))).toBe(true);
});

test("複数行の入力欄は文字を打ち込める場所として扱う", () => {
  expect(ElementEx.isTextEditable(document.createElement("textarea"))).toBe(
    true,
  );
});

test("ふつうの要素は文字を打ち込める場所ではない", () => {
  expect(ElementEx.isTextEditable(document.createElement("div"))).toBe(false);
});

test("要素でない発火元は文字を打ち込める場所ではない", () => {
  expect(ElementEx.isTextEditable(document)).toBe(false);
});

test("発火元が無い場合は文字を打ち込める場所ではない", () => {
  expect(ElementEx.isTextEditable(null)).toBe(false);
});

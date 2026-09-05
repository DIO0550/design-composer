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

test("選択欄は選択肢から選ぶ場所として扱う", () => {
  expect(ElementEx.isSelectControl(document.createElement("select"))).toBe(
    true,
  );
});

test("選択欄は文字を打ち込める場所ではない", () => {
  // 2 つを分けているのは、受け取るキーの範囲が違うため
  expect(ElementEx.isTextEditable(document.createElement("select"))).toBe(
    false,
  );
});

test("入力欄は選択肢から値を選ぶ場所ではない", () => {
  expect(ElementEx.isSelectControl(document.createElement("input"))).toBe(
    false,
  );
});

test("発火元が無い場合は選択肢から値を選ぶ場所ではない", () => {
  expect(ElementEx.isSelectControl(null)).toBe(false);
});

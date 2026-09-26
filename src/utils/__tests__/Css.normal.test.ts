import { afterEach, expect, test } from "vitest";
import { Css } from "@/utils/Css";

afterEach(() => {
  globalThis.document.body.innerHTML = "";
});

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

test("属性選択子は、その属性がその値の要素に当たる", () => {
  globalThis.document.body.innerHTML =
    '<div data-kind="home" data-name="panel"></div><div data-kind="panel"></div>';

  const found = globalThis.document.querySelectorAll(
    Css.attributeSelector("data-kind", "panel"),
  );

  expect(
    Array.from(found, (element) => element.getAttribute("data-kind")),
  ).toEqual(["panel"]);
});

test("引用符を含む値でも属性選択子が途中で閉じない", () => {
  /*
   * 要素に当たるかでは確かめられない。happy-dom の選択子の解釈は `\"` を受け付けず投げる
   * （Chromium では `a"b` の要素だけに当たることを実測）。
   */
  expect(Css.attributeSelector("data-name", 'a"b')).toBe('[data-name="a\\"b"]');
});

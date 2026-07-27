import { expect, test } from "vitest";
import { Html } from "../Html";

test("テキストに含まれるタグの記号は実体参照になる", () => {
  expect(Html.escapeText("<script>alert(1)</script>")).toBe(
    "&lt;script&gt;alert(1)&lt;/script&gt;",
  );
});

test("テキストのアンパサンドは実体参照として扱われないよう変換される", () => {
  expect(Html.escapeText("Tom & Jerry")).toBe("Tom &amp; Jerry");
});

test("既に実体参照の形をしている文字列も二重に解釈されない形に変換される", () => {
  expect(Html.escapeText("&lt;")).toBe("&amp;lt;");
});

test("テキストの引用符はそのまま残る", () => {
  expect(Html.escapeText(`"引用" と 'それ'`)).toBe(`"引用" と 'それ'`);
});

test("日本語や記号を含むテキストは変換されずそのまま残る", () => {
  expect(Html.escapeText("ログイン画面 · 余白 100%")).toBe(
    "ログイン画面 · 余白 100%",
  );
});

test("属性値の二重引用符は実体参照になり属性を閉じられない", () => {
  expect(Html.escapeAttribute(`a" onclick="alert(1)`)).toBe(
    "a&quot; onclick=&quot;alert(1)",
  );
});

test("属性値でもタグの記号とアンパサンドは実体参照になる", () => {
  expect(Html.escapeAttribute("<&>")).toBe("&lt;&amp;&gt;");
});

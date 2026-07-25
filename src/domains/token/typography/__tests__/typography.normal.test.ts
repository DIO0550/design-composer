import { expect, test } from "vitest";
import { TypographyToken } from "../index";

test("typography トークンのフィールドを列挙すると 04-tokens で定義された4フィールドが返る", () => {
  expect(TypographyToken.fields()).toEqual([
    "fontSize",
    "lineHeight",
    "fontWeight",
    "fontFamily",
  ]);
});

test("フィールドに対応する CSS プロパティ名が引ける", () => {
  expect(TypographyToken.cssProperty("fontSize")).toBe("font-size");
  expect(TypographyToken.cssProperty("lineHeight")).toBe("line-height");
  expect(TypographyToken.cssProperty("fontWeight")).toBe("font-weight");
  expect(TypographyToken.cssProperty("fontFamily")).toBe("font-family");
});

test("fontSize の CSS 値は px 単位付きになる", () => {
  const token = { fontSize: 16, lineHeight: 1.6, fontWeight: 400 };

  expect(TypographyToken.cssValue({ token, field: "fontSize" })).toBe("16px");
});

test("lineHeight の CSS 値は単位なしの倍率になる", () => {
  const token = { fontSize: 16, lineHeight: 1.6, fontWeight: 400 };

  expect(TypographyToken.cssValue({ token, field: "lineHeight" })).toBe("1.6");
});

test("fontWeight の CSS 値は数値をそのまま文字列にしたものになる", () => {
  const token = { fontSize: 24, lineHeight: 1.4, fontWeight: 700 };

  expect(TypographyToken.cssValue({ token, field: "fontWeight" })).toBe("700");
});

test("指定された fontFamily はそのまま CSS 値になる", () => {
  const token = {
    fontSize: 16,
    lineHeight: 1.6,
    fontWeight: 400,
    fontFamily: "Inter, sans-serif",
  };

  expect(TypographyToken.cssValue({ token, field: "fontFamily" })).toBe(
    "Inter, sans-serif",
  );
});

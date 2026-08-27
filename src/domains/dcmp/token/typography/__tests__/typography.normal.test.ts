import { expect, test } from "vitest";
import { TypographyFieldRef, TypographyToken } from "../index";

test("typography トークンのフィールドを列挙すると 04-tokens で定義された4フィールドが返る", () => {
  expect(TypographyToken.fields()).toEqual([
    "fontSize",
    "lineHeight",
    "fontWeight",
    "fontFamily",
  ]);
});

test("フィールドに対応する CSS プロパティ名が引ける", () => {
  const token = { fontSize: 16, lineHeight: 1.6, fontWeight: 400 };

  expect(
    TypographyToken.fields().map((field) =>
      TypographyFieldRef.cssProperty(TypographyFieldRef.create(token, field)),
    ),
  ).toEqual(["font-size", "line-height", "font-weight", "font-family"]);
});

test("トークンとフィールドから参照を作るとその2つを保持する", () => {
  const token = { fontSize: 16, lineHeight: 1.6, fontWeight: 400 };

  expect(TypographyFieldRef.create(token, "fontSize")).toEqual({
    token,
    field: "fontSize",
  });
});

test("fontSize の CSS 値は px 単位付きになる", () => {
  const token = { fontSize: 16, lineHeight: 1.6, fontWeight: 400 };

  expect(
    TypographyFieldRef.cssValue(TypographyFieldRef.create(token, "fontSize")),
  ).toBe("16px");
});

test("lineHeight の CSS 値は単位なしの倍率になる", () => {
  const token = { fontSize: 16, lineHeight: 1.6, fontWeight: 400 };

  expect(
    TypographyFieldRef.cssValue(TypographyFieldRef.create(token, "lineHeight")),
  ).toBe("1.6");
});

test("fontWeight の CSS 値は数値をそのまま文字列にしたものになる", () => {
  const token = { fontSize: 24, lineHeight: 1.4, fontWeight: 700 };

  expect(
    TypographyFieldRef.cssValue(TypographyFieldRef.create(token, "fontWeight")),
  ).toBe("700");
});

test("指定された fontFamily はそのまま CSS 値になる", () => {
  const token = {
    fontSize: 16,
    lineHeight: 1.6,
    fontWeight: 400,
    fontFamily: "Inter, sans-serif",
  };

  expect(
    TypographyFieldRef.cssValue(TypographyFieldRef.create(token, "fontFamily")),
  ).toBe("Inter, sans-serif");
});

import { expect, test } from "vitest";
import { Font } from "@/utils/Font";
import { TypographyToken } from "../index";

test("fontFamily を省略するとシステムフォントスタックが既定値になる", () => {
  const token = { fontSize: 16, lineHeight: 1.6, fontWeight: 400 };

  expect(TypographyToken.fontFamilyOf(token)).toBe(Font.systemStack());
});

test("fontFamily を省略したトークンの CSS 値もシステムフォントスタックになる", () => {
  const token = { fontSize: 16, lineHeight: 1.6, fontWeight: 400 };

  expect(TypographyToken.cssValue({ token, field: "fontFamily" })).toBe(
    Font.systemStack(),
  );
});

test("全フィールドを変換しても未定義になる値は無い", () => {
  const token = { fontSize: 12, lineHeight: 1.4, fontWeight: 400 };

  const values = TypographyToken.fields().map((field) =>
    TypographyToken.cssValue({ token, field }),
  );

  expect(values.every((value) => value.length > 0)).toBe(true);
});

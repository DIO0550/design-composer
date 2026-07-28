import { expect, test } from "vitest";
import { Result } from "@/utils/Result";
import { TypographyToken } from "../index";

test("typography は fontSize・lineHeight・fontWeight から読み込まれる", () => {
  const token = Result.unwrap(
    TypographyToken.fromJson(
      { fontSize: 16, lineHeight: 1.6, fontWeight: 400 },
      "body",
    ),
  );

  expect(token).toEqual({ fontSize: 16, lineHeight: 1.6, fontWeight: 400 });
});

test("fontFamily は省略できる", () => {
  const token = Result.unwrap(
    TypographyToken.fromJson(
      { fontSize: 16, lineHeight: 1.6, fontWeight: 400 },
      "body",
    ),
  );

  expect(token.fontFamily).toBeUndefined();
});

test("必須フィールドが欠けている typography は読み込めない", () => {
  expect(TypographyToken.fromJson({ fontSize: 16 }, "body").ok).toBe(false);
});

test("typography は仕様の定義順で書き出される", () => {
  const written = TypographyToken.toJson({
    fontSize: 16,
    lineHeight: 1.6,
    fontWeight: 400,
    fontFamily: "Inter",
  });

  expect(Object.keys(written)).toEqual([
    "fontSize",
    "lineHeight",
    "fontWeight",
    "fontFamily",
  ]);
});

test("省略された fontFamily は書き出されない", () => {
  const written = TypographyToken.toJson({
    fontSize: 16,
    lineHeight: 1.6,
    fontWeight: 400,
  });

  expect(Object.keys(written)).toEqual([
    "fontSize",
    "lineHeight",
    "fontWeight",
  ]);
});

import { expect, test } from "vitest";
import { Result } from "@/utils/Result";
import { ShadowToken } from "../index";

test("影は x・y・blur・色から読み込まれる", () => {
  const shadow = Result.unwrap(
    ShadowToken.fromJson({ x: 0, y: 1, blur: 3, color: "#0000001a" }, "sm"),
  );

  expect(shadow).toEqual({ x: 0, y: 1, blur: 3, color: "#0000001a" });
});

test("spread は省略できる", () => {
  const shadow = Result.unwrap(
    ShadowToken.fromJson({ x: 0, y: 1, blur: 3, color: "#000000" }, "sm"),
  );

  expect(ShadowToken.spreadOf(shadow)).toBe(0);
});

test("必須フィールドが欠けている影は読み込めない", () => {
  expect(ShadowToken.fromJson({ x: 0, y: 1 }, "sm").ok).toBe(false);
});

test("影は仕様の定義順で書き出される", () => {
  const written = ShadowToken.toJson({
    x: 0,
    y: 1,
    blur: 3,
    spread: 2,
    color: "#0000001a",
  });

  expect(Object.keys(written)).toEqual(["x", "y", "blur", "spread", "color"]);
});

test("省略された spread は書き出されない", () => {
  const written = ShadowToken.toJson({
    x: 0,
    y: 1,
    blur: 3,
    color: "#0000001a",
  });

  expect(Object.keys(written)).toEqual(["x", "y", "blur", "color"]);
});

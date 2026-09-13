import { expect, expectTypeOf, test } from "vitest";
import { Result } from "../Result";

/*
 * 絞り込みが効くことを固定する（`rules/coding.md`「型レベルの保証が仕様の一部であるとき
 * は `expectTypeOf` で退行を検知する」）。効かなくなると `isOk` は真偽を答えるだけの関数に
 * なり、通した先で `value` も `error` も読めなくなる。
 */

test("isOk が真の側では成功値を読める型に絞られる", () => {
  const result: Result<number, string> = Result.ok(42);

  const value = Result.isOk(result) ? result.value : 0;

  expectTypeOf(value).toEqualTypeOf<number>();
  expect(value).toBe(42);
});

test("isOk が偽の側では失敗のエラーを読める型に絞られる", () => {
  const result: Result<number, string> = Result.err("fail");

  const error = Result.isOk(result) ? "" : result.error;

  expectTypeOf(error).toEqualTypeOf<string>();
  expect(error).toBe("fail");
});

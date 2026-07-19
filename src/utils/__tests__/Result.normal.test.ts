import { expect, test } from "vitest";
import { Result } from "../Result";

test("ok で生成した結果は成功として値を保持する", () => {
  expect(Result.ok(42)).toEqual({ ok: true, value: 42 });
});

test("err で生成した結果は失敗としてエラーを保持する", () => {
  expect(Result.err("fail")).toEqual({ ok: false, error: "fail" });
});

test("ok フラグで絞り込むと成功値にアクセスできる", () => {
  const result: Result<number, string> = Result.ok(42);
  expect(result.ok && result.value).toBe(42);
});

test("ok フラグで絞り込むと失敗のエラーにアクセスできる", () => {
  const result: Result<number, string> = Result.err("fail");
  expect(!result.ok && result.error).toBe("fail");
});

test("map は成功値を変換した新しい成功結果を返す", () => {
  expect(Result.map(Result.ok(2), (v) => v * 3)).toEqual({
    ok: true,
    value: 6,
  });
});

test("map は失敗をそのまま返す", () => {
  const failure: Result<number, string> = Result.err("fail");
  expect(Result.map(failure, (v: number) => v * 3)).toBe(failure);
});

test("flatMap は成功値に続く処理を連結できる", () => {
  const double = (n: number): Result<number, string> => Result.ok(n * 2);
  expect(Result.flatMap(Result.ok(5), double)).toEqual({
    ok: true,
    value: 10,
  });
});

test("flatMap は失敗で短絡してそのまま返す", () => {
  const failure: Result<number, string> = Result.err("fail");
  const double = (n: number): Result<number, string> => Result.ok(n * 2);
  expect(Result.flatMap(failure, double)).toBe(failure);
});

test("flatMap は連結した処理の失敗を伝播する", () => {
  expect(Result.flatMap(Result.ok(5), () => Result.err("inner fail"))).toEqual({
    ok: false,
    error: "inner fail",
  });
});

test("unwrapOr は成功から値を取り出す", () => {
  expect(Result.unwrapOr(Result.ok(42), 0)).toBe(42);
});

test("unwrapOr は失敗に対してデフォルト値を返す", () => {
  expect(Result.unwrapOr(Result.err("fail"), 0)).toBe(0);
});

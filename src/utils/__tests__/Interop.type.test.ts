import { expect, expectTypeOf, test } from "vitest";
import { Interop } from "../Interop";
import { Option } from "../Option";
import { Result } from "../Result";

test("toOption は null を成功値に持つ Result を型レベルで拒否する", () => {
  // @ts-expect-error null は NonNullable<unknown> 制約に違反する
  const converted = Interop.toOption(Result.ok(null));
  expect(converted).toEqual({ some: true, value: null });
});

test("toOption は undefined を成功値に持つ Result を型レベルで拒否する", () => {
  // @ts-expect-error undefined は NonNullable<unknown> 制約に違反する
  const converted = Interop.toOption(Result.ok(undefined));
  expect(converted).toEqual({ some: true, value: undefined });
});

test("toOption は null を含む union 型の Result を型レベルで拒否する", () => {
  const result: Result<string | null, string> = Result.ok("hello");
  // @ts-expect-error string | null は NonNullable<unknown> 制約に違反する
  const converted = Interop.toOption(result);
  expect(converted).toEqual({ some: true, value: "hello" });
});

test("toOption は unknown 型の Result を型レベルで拒否する", () => {
  const result: Result<unknown, string> = Result.ok(42);
  // @ts-expect-error unknown は nullish を含みうるため制約に違反する
  const converted = Interop.toOption(result);
  expect(converted).toEqual({ some: true, value: 42 });
});

test("toOption の戻り値型は Option に完全一致する", () => {
  const result: Result<number, string> = Result.ok(42);
  const converted = Interop.toOption(result);
  expectTypeOf(converted).toEqualTypeOf<Option<number>>();
  expect(converted).toEqual({ some: true, value: 42 });
});

test("toOption は非 nullish の union 型を許容する", () => {
  const result: Result<string | number, string> = Result.ok(7);
  expect(Interop.toOption(result)).toEqual({ some: true, value: 7 });
});

test("toResult は nullish を含む Option も制約なしで受け取れる", () => {
  const option: Option<string | null> = Option.some("hello");
  const result = Interop.toResult(option, "missing");
  expectTypeOf(result).toEqualTypeOf<Result<string | null, string>>();
  expect(result).toEqual({ ok: true, value: "hello" });
});

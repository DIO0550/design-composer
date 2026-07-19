import { expect, test } from "vitest";
import { Interop } from "../Interop";
import { Option } from "../Option";
import { Result } from "../Result";

test("toOption は成功を存在する値に変換する", () => {
  expect(Interop.toOption(Result.ok(42))).toEqual({ some: true, value: 42 });
});

test("toOption は失敗を none に変換する(エラー情報は破棄される)", () => {
  expect(Interop.toOption(Result.err("error"))).toBe(Option.none);
});

test("toResult は存在する値を成功に変換する", () => {
  expect(Interop.toResult(Option.some(42), "missing")).toEqual({
    ok: true,
    value: 42,
  });
});

test("toResult は none を指定エラーの失敗に変換する", () => {
  expect(Interop.toResult(Option.none, "missing")).toEqual({
    ok: false,
    error: "missing",
  });
});

test("存在する値は toResult と toOption の往復で保存される", () => {
  const roundTripped = Interop.toOption(Interop.toResult(Option.some(42), "e"));
  expect(roundTripped).toEqual({ some: true, value: 42 });
});

test("成功値は toOption と toResult の往復で保存される", () => {
  const roundTripped = Interop.toResult(Interop.toOption(Result.ok(42)), "e");
  expect(roundTripped).toEqual({ ok: true, value: 42 });
});

test("none は toResult と toOption の往復で none に戻る", () => {
  const roundTripped = Interop.toOption(
    Interop.toResult<number, string>(Option.none, "e"),
  );
  expect(roundTripped).toBe(Option.none);
});

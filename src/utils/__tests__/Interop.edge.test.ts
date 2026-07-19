import { expect, test } from "vitest";
import { Interop } from "../Interop";
import { Option } from "../Option";
import { Result } from "../Result";

test.each([
  [0],
  [false],
  [""],
])("falsy な成功値 %j でも toOption は存在する値に変換する", (value) => {
  expect(Interop.toOption(Result.ok(value))).toEqual({ some: true, value });
});

test.each([
  [0],
  [false],
  [""],
])("falsy な値 %j でも toResult は成功に変換する", (value) => {
  expect(Interop.toResult(Option.some(value), "missing")).toEqual({
    ok: true,
    value,
  });
});

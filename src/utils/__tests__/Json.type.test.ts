import { expectTypeOf, test } from "vitest";
import type { JsonObject, JsonValue } from "../Json";
import type { None, Option, Some } from "../Option";
import type { Err, Ok } from "../Result";

test("値を持つ Option は JSON の値として代入できない", () => {
  expectTypeOf<Some<string>>().not.toExtend<JsonValue>();
});

test("不在の Option は JSON の値として代入できない", () => {
  expectTypeOf<None>().not.toExtend<JsonValue>();
});

test("成功の Result は JSON の値として代入できない", () => {
  expectTypeOf<Ok<string>>().not.toExtend<JsonValue>();
});

test("失敗の Result は JSON の値として代入できない", () => {
  expectTypeOf<Err<string>>().not.toExtend<JsonValue>();
});

test("フィールドに Option を持つオブジェクトは JSON のオブジェクトとして代入できない", () => {
  expectTypeOf<Readonly<{ name: Option<string> }>>().not.toExtend<JsonObject>();
});

test("文字列のキーだけで入れ子になったオブジェクトは JSON の値として代入できる", () => {
  expectTypeOf<
    Readonly<{ name: string; frame: Readonly<{ width: number }> }>
  >().toExtend<JsonValue>();
});

test("文字列のキーで引く辞書は JSON のオブジェクトとして代入できる", () => {
  expectTypeOf<Readonly<Record<string, number>>>().toExtend<JsonObject>();
});

test("要素に Option を持つ配列は JSON の値として代入できない", () => {
  expectTypeOf<readonly Option<string>[]>().not.toExtend<JsonValue>();
});

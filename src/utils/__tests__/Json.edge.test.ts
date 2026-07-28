import { expect, test } from "vitest";
import { Json, type JsonDecoded, type JsonDecodeError } from "@/utils/Json";
import { Result } from "@/utils/Result";

function errorsOf(result: JsonDecoded<unknown>): readonly JsonDecodeError[] {
  return result.ok ? [] : result.error;
}

test("期待と違う型の値は位置つきで報告される", () => {
  expect(errorsOf(Json.string(16, "artboards[0].name"))).toEqual([
    {
      kind: "invalid-type",
      path: "artboards[0].name",
      message: "expected string but got number",
    },
  ]);
});

test("null は型が違う値として報告される", () => {
  expect(errorsOf(Json.number(null, "width"))).toEqual([
    {
      kind: "invalid-type",
      path: "width",
      message: "expected number but got null",
    },
  ]);
});

test("配列をオブジェクトとして読もうとすると型が違う値として報告される", () => {
  expect(errorsOf(Json.record([], "tokens"))).toEqual([
    {
      kind: "invalid-type",
      path: "tokens",
      message: "expected object but got array",
    },
  ]);
});

test("必須フィールドが無いと欠落として報告される", () => {
  expect(
    errorsOf(Json.required({}, "artboards[0]", "name", Json.string)),
  ).toEqual([
    {
      kind: "missing-field",
      path: "artboards[0].name",
      message: '"name" is required',
    },
  ]);
});

test("知らないフィールドは未知のフィールドとして報告される", () => {
  const record = { name: "screen", zoom: 1.5 };

  expect(
    errorsOf(Json.knownFields(Result.ok("ok"), record, "", ["name"])),
  ).toEqual([
    { kind: "unknown-field", path: "zoom", message: 'unknown field "zoom"' },
  ]);
});

test("プロトタイプ由来のキーはフィールドとして存在しない扱いになる", () => {
  expect(errorsOf(Json.required({}, "", "toString", Json.string))).toEqual([
    {
      kind: "missing-field",
      path: "toString",
      message: '"toString" is required',
    },
  ]);
});

test("複数の値をまとめるとき失敗した分のエラーがすべて集まる", () => {
  const combined = Json.combine2(
    Json.string(1, "a"),
    Json.string(2, "b"),
    (a, b) => `${a}${b}`,
  );

  expect(errorsOf(combined).map((error) => error.path)).toEqual(["a", "b"]);
});

test("辞書の中の複数の不正はまとめて報告される", () => {
  const decoded = Json.mapOf({ sm: "8", md: "16" }, "spacing", Json.number);

  expect(errorsOf(decoded).map((error) => error.path)).toEqual([
    "spacing.sm",
    "spacing.md",
  ]);
});

test("配列の中の複数の不正は位置つきでまとめて報告される", () => {
  const decoded = Json.arrayOf([1, 2], "names", Json.string);

  expect(errorsOf(decoded).map((error) => error.path)).toEqual([
    "names[0]",
    "names[1]",
  ]);
});

test("値の位置は入れ子をたどった形で示される", () => {
  const decoded = Json.mapOf(
    { card: { title: 1 } },
    "components",
    (value, path) => Json.mapOf(value, path, Json.string),
  );

  expect(errorsOf(decoded).map((error) => error.path)).toEqual([
    "components.card.title",
  ]);
});

import { expect, test } from "vitest";
import { JsonLexicalScanner } from "../index";

test("空文字列は構文エラーとして検出される", () => {
  const errors = JsonLexicalScanner.scan("");
  expect(errors).toEqual([
    { kind: "syntax-error", message: "unexpected end of input", position: 0 },
  ]);
});

test("末尾にカンマがある不正なJSONは構文エラーとして検出される", () => {
  const errors = JsonLexicalScanner.scan('{"a":1,}');
  expect(errors).toHaveLength(1);
  expect(errors[0].kind).toBe("syntax-error");
});

test("閉じられていない文字列は構文エラーとして検出される", () => {
  const errors = JsonLexicalScanner.scan('{"a":"b}');
  expect(errors).toEqual([
    { kind: "syntax-error", message: "unterminated string", position: 5 },
  ]);
});

test("エスケープされた引用符を含むキーはひとつのキーとして扱われ、誤って構文エラーにならない", () => {
  const errors = JsonLexicalScanner.scan('{"a\\"b":1}');
  expect(errors).toEqual([]);
});

test("3階層以上ネストしていても重複キーが検出される", () => {
  const errors = JsonLexicalScanner.scan(
    '{"level1":{"level2":{"level3":{"x":1,"x":2}}}}',
  );
  expect(errors).toHaveLength(1);
  expect(errors[0].kind).toBe("duplicate-key");
  expect(errors[0].message).toBe('duplicate key "x"');
});

test("正常なJSONの後に余分な文字列があると構文エラーとして検出される", () => {
  const errors = JsonLexicalScanner.scan('{"a":1}extra');
  expect(errors).toEqual([
    {
      kind: "syntax-error",
      message: "unexpected trailing content",
      position: 7,
    },
  ]);
});

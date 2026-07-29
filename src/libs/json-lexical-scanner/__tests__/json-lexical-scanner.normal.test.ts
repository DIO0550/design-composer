import { expect, test } from "vitest";
import { JsonLexicalScanner } from "../index";

test("正常なJSONではエラーが検出されない", () => {
  const errors = JsonLexicalScanner.scan(
    '{"formatVersion":"1.0","tokens":{"colors":{"primary":"#3b82f6"}},"components":{},"artboards":[]}',
  );
  expect(errors).toEqual([]);
});

test("同一オブジェクト内に重複したキーがあるとき、重複キーとして検出される", () => {
  const errors = JsonLexicalScanner.scan('{"a":1,"a":2}');
  expect(errors).toEqual([
    { kind: "duplicate-key", message: 'duplicate key "a"', position: 7 },
  ]);
});

test("ネストしたオブジェクト内の重複キーも検出される", () => {
  const errors = JsonLexicalScanner.scan('{"outer":{"a":1,"a":2}}');
  expect(errors).toEqual([
    { kind: "duplicate-key", message: 'duplicate key "a"', position: 16 },
  ]);
});

test("異なるオブジェクトに属する同名キーは重複として検出されない", () => {
  const errors = JsonLexicalScanner.scan('{"a":{"a":1}}');
  expect(errors).toEqual([]);
});

test("配列内の複数オブジェクトの重複キーがそれぞれ独立して検出される", () => {
  const errors = JsonLexicalScanner.scan('[{"a":1,"a":2},{"b":1,"b":2}]');
  expect(errors).toEqual([
    { kind: "duplicate-key", message: 'duplicate key "a"', position: 8 },
    { kind: "duplicate-key", message: 'duplicate key "b"', position: 22 },
  ]);
});

test("JSONとしてパース不能な入力は構文エラーとして検出される", () => {
  const errors = JsonLexicalScanner.scan('{"a":}');
  expect(errors).toHaveLength(1);
  expect(errors[0].kind).toBe("syntax-error");
});

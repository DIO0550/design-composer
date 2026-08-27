import { expect, test } from "vitest";
import { NameSpace } from "../index";

test("kebab-case の名前は識別子として正しい", () => {
  expect(NameSpace.isValidIdentifier("login-form")).toBe(true);
});

test("ハイフンを含まない単語1つの名前は識別子として正しい", () => {
  expect(NameSpace.isValidIdentifier("label")).toBe(true);
});

test("数字で始まる名前は識別子として正しい", () => {
  expect(NameSpace.isValidIdentifier("2-column-layout")).toBe(true);
});

test("自動採番が付けた連番付きの名前は識別子として正しい", () => {
  expect(NameSpace.isValidIdentifier("login-form-2")).toBe(true);
});

test("大文字を含む名前は識別子として不正", () => {
  expect(NameSpace.isValidIdentifier("Label")).toBe(false);
});

test("アンダースコアを含む名前は識別子として不正", () => {
  expect(NameSpace.isValidIdentifier("login_form")).toBe(false);
});

test("先頭がハイフンの名前は識別子として不正", () => {
  expect(NameSpace.isValidIdentifier("-label")).toBe(false);
});

test("末尾がハイフンの名前は識別子として不正", () => {
  expect(NameSpace.isValidIdentifier("label-")).toBe(false);
});

test("ハイフンが連続する名前は識別子として不正", () => {
  expect(NameSpace.isValidIdentifier("login--form")).toBe(false);
});

test("空文字は識別子として不正", () => {
  expect(NameSpace.isValidIdentifier("")).toBe(false);
});

test("パス修飾のために予約された文字を含む名前は識別子として不正", () => {
  expect(NameSpace.isValidIdentifier("a/b")).toBe(false);
  expect(NameSpace.isValidIdentifier("a#b")).toBe(false);
  expect(NameSpace.isValidIdentifier("a.b")).toBe(false);
});

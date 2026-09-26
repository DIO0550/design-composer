import { expect, test } from "vitest";
import { TokenSet } from "@/domains/dcmp/token";
import { DocumentNames } from "../index";

test("kebab-case の名前は識別子として正しい", () => {
  expect(DocumentNames.isValidIdentifier("login-form")).toBe(true);
});

test("ハイフンを含まない単語1つの名前は識別子として正しい", () => {
  expect(DocumentNames.isValidIdentifier("label")).toBe(true);
});

test("数字で始まる名前は識別子として正しい", () => {
  expect(DocumentNames.isValidIdentifier("2-column-layout")).toBe(true);
});

test("自動採番が付けた連番付きの名前は識別子として正しい", () => {
  expect(DocumentNames.isValidIdentifier("login-form-2")).toBe(true);
});

test("大文字を含む名前は識別子として不正", () => {
  expect(DocumentNames.isValidIdentifier("Label")).toBe(false);
});

test("アンダースコアを含む名前は識別子として不正", () => {
  expect(DocumentNames.isValidIdentifier("login_form")).toBe(false);
});

test("先頭がハイフンの名前は識別子として不正", () => {
  expect(DocumentNames.isValidIdentifier("-label")).toBe(false);
});

test("末尾がハイフンの名前は識別子として不正", () => {
  expect(DocumentNames.isValidIdentifier("label-")).toBe(false);
});

test("ハイフンが連続する名前は識別子として不正", () => {
  expect(DocumentNames.isValidIdentifier("login--form")).toBe(false);
});

test("空文字は識別子として不正", () => {
  expect(DocumentNames.isValidIdentifier("")).toBe(false);
});

test("パス修飾のために予約された文字を含む名前は識別子として不正", () => {
  expect(DocumentNames.isValidIdentifier("a/b")).toBe(false);
  expect(DocumentNames.isValidIdentifier("a#b")).toBe(false);
  expect(DocumentNames.isValidIdentifier("a.b")).toBe(false);
});

test("数字だけの名前は識別子として不正", () => {
  expect(DocumentNames.isValidIdentifier("3")).toBe(false);
});

test("先頭が 0 の数字だけの名前も識別子として不正", () => {
  expect(DocumentNames.isValidIdentifier("007")).toBe(false);
});

test("数字とハイフンだけからなる名前は識別子として正しい", () => {
  expect(DocumentNames.isValidIdentifier("2-3")).toBe(true);
});

test("識別子の規則はトークン名の規則と同じ答えを返す", () => {
  const names = ["3", "007", "2-3", "label", "Label"];

  expect(names.map(DocumentNames.isValidIdentifier)).toEqual(
    names.map(TokenSet.isValidName),
  );
});

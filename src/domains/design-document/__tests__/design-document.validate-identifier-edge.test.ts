import { expect, test } from "vitest";
import { DesignDocument } from "../index";

test("先頭がハイフンの名前は識別子として不正", () => {
  expect(DesignDocument.isValidIdentifier("-label")).toBe(false);
});

test("末尾がハイフンの名前は識別子として不正", () => {
  expect(DesignDocument.isValidIdentifier("label-")).toBe(false);
});

test("ハイフンが連続する名前は識別子として不正", () => {
  expect(DesignDocument.isValidIdentifier("login--form")).toBe(false);
});

test("空文字は識別子として不正", () => {
  expect(DesignDocument.isValidIdentifier("")).toBe(false);
});

test("数字で始まる名前は識別子として正しい", () => {
  expect(DesignDocument.isValidIdentifier("2-column-layout")).toBe(true);
});

test("自動リネームが生成する連番付きの名前は識別子として正しい", () => {
  expect(DesignDocument.isValidIdentifier("login-form-2")).toBe(true);
});

test("ハイフンを含まない単語1つの名前は識別子として正しい", () => {
  expect(DesignDocument.isValidIdentifier("label")).toBe(true);
});

test("識別子規則に違反する名前が重複していると規則違反と重複の両方が報告される", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "Label", type: "Text" },
          { name: "Label", type: "Text" },
        ],
      },
    ],
  });

  const errors = DesignDocument.collectErrors(document);

  expect(errors.map((error) => error.kind)).toEqual([
    "invalid-identifier",
    "invalid-identifier",
    "duplicate-name",
  ]);
});

import type { DocumentError } from "@/domains/session/document-error";

/**
 * 外部エディタが不正なファイルを保存したときに届くエラー。
 *
 * ファイル由来のエラーを 1 件だけ要するテストが複数あるので、同じ値をそれぞれに書かず共有
 * する（rules/testing.md「同じヘルパーを 2 つ以上のテストファイルに書いたら共通化する」）。
 */
export const SampleSyntaxError: DocumentError = {
  kind: "syntax-error",
  message: "expected ',' or '}'",
  location: { kind: "text-position", position: 42 },
};

/** 値が hex でない色トークン `brand` のエラー。トークンを指すエラーを 1 件要するテストで共有する。 */
export const SampleTokenError: DocumentError = {
  kind: "invalid-color",
  message:
    'color token "brand" is not a hex color in normal form (#rrggbb / #rrggbbaa)',
  location: { kind: "token", tokenName: "brand" },
};

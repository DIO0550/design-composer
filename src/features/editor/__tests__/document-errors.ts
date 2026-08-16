import type { DocumentError } from "@/features/editor/domains/document-error";

/**
 * 外部エディタが不正なファイルを保存したときに届くエラー。
 *
 * ファイル由来のエラーを 1 件だけ要するテストが複数あるので、同じ値をそれぞれに
 * 書かず共有する（rules/testing.md「同じヘルパーを 2 つ以上のテストファイルに
 * 書いたら共通化する」）。
 */
export const SampleSyntaxError: DocumentError = {
  kind: "syntax-error",
  message: "expected ',' or '}'",
  location: { kind: "text-position", position: 42 },
};

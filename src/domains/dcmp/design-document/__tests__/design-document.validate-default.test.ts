import { expect, test } from "vitest";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";
import { documentWithText } from "./text-node-setup";

/** `typography` の `body` を消したドキュメント。 */
function withoutBodyTypography(document: DesignDocument): DesignDocument {
  return Result.unwrap(
    DesignDocument.removeToken(document, { kind: "typography", name: "body" }),
  );
}

test("デフォルトが効いている Text の参照先トークンを削除すると dangling-token エラーになる", () => {
  const document = documentWithText({ content: "あ" });

  const removed = withoutBodyTypography(document);

  expect(DesignDocument.collectErrors(removed)).toEqual([
    expect.objectContaining({
      kind: "dangling-token",
      nodeName: "plain",
      prop: "typography",
    }),
  ]);
});

test("prop を明示設定していれば、デフォルトが指すトークンを削除してもエラーにならない", () => {
  const document = documentWithText({ content: "あ", typography: "heading" });

  const removed = withoutBodyTypography(document);

  expect(DesignDocument.collectErrors(removed)).toEqual([]);
});

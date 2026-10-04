import { expect, test } from "vitest";
import { Result } from "@/utils/Result";
import { DesignDocument, DocumentTemplate } from "../index";
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

test("デフォルトが効いている Ellipse の塗りのトークンを削除すると dangling-token エラーになる", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [{ name: "dot", type: "Ellipse" }],
      },
    ],
  });

  const removed = Result.unwrap(
    DesignDocument.removeToken(document, { kind: "colors", name: "gray-300" }),
  );

  expect(DesignDocument.collectErrors(removed)).toEqual([
    expect.objectContaining({
      kind: "dangling-token",
      nodeName: "dot",
      prop: "background",
    }),
  ]);
});

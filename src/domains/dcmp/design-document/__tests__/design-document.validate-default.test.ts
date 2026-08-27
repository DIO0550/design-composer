import { expect, test } from "vitest";
import type { Props } from "@/domains/dcmp/node";
import { Result } from "@/utils/Result";
import { DesignDocument, DocumentTemplate } from "../index";

/**
 * 雛形のトークンと、Text を 1 つ持つ artboard からなるドキュメント。
 *
 * @param props その Text に設定する props。デフォルトが効く側と明示設定が勝つ側の
 *   違いを、この引数だけにするためにファクトリで受け取る
 * @returns その Text を持つドキュメント
 */
function documentWithText(props: Props): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [{ name: "plain", type: "Text", props }],
      },
    ],
  });
}

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

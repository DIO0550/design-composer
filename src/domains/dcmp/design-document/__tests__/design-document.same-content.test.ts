import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { TokenSet } from "@/domains/dcmp/token";

/**
 * `primary` の色だけを持つドキュメント。呼ぶたびに別の参照を作る。
 *
 * @param primary `primary` の色
 * @returns `colors.primary` だけを持つドキュメント
 */
function documentWithPrimary(primary: string): DesignDocument {
  return DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { primary } },
  });
}

test("別々に作った同じ中身のドキュメントは同じとみなす", () => {
  expect(
    DesignDocument.isSameContent(
      documentWithPrimary("#000000"),
      documentWithPrimary("#000000"),
    ),
  ).toBe(true);
});

test("トークンの値が 1 つ違えば同じとみなさない", () => {
  expect(
    DesignDocument.isSameContent(
      documentWithPrimary("#000000"),
      documentWithPrimary("#ffffff"),
    ),
  ).toBe(false);
});

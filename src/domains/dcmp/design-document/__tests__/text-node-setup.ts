import type { Props } from "@/domains/dcmp/node";
import { DesignDocument, DocumentTemplate } from "../index";

/**
 * 雛形のトークンと、Text を 1 つ持つ artboard からなるドキュメント。
 *
 * 雛形のトークンを必ず入れるのは、Text の `typography` / `color` がスキーマの
 * デフォルトでトークンを参照するため。空のトークンで組むと、見たい観点とは別に
 * dangling-token が 2 件出る。
 *
 * @param props その Text に設定する props。テストごとに変えたいのはここだけなので
 *   ファクトリで受け取る
 * @returns その Text を持つドキュメント
 */
export function documentWithText(props: Props): DesignDocument {
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

import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import type { Option } from "@/utils/Option";

/**
 * artboard・インスタンス・部品にできるノードが揃ったドキュメント。
 * `home-panel` と `home-title` はどちらも部品にできるので、選び直しの取り直しも作れる。
 */
export function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "home-panel",
            type: "Box",
            children: [{ name: "home-title", type: "Text" }],
          },
          { name: "home-login", ref: "primary-button" },
        ],
      },
    ],
  });
}

/**
 * テストが `CreateComponent` に渡す入力の対。
 * `singleName` だけを差し替えて各ケースを組み立てるための小さいまとまり。
 */
export type CreateComponentInput = Readonly<{
  document: DesignDocument;
  singleName: Option<string>;
}>;

/**
 * 名前を選んだ状態。
 *
 * @param singleName 選んでおく名前。不在なら何も選んでいない状態
 * @returns 上の`setupDocument()` と、その中から選んだ名前の対
 */
export function setupInput(singleName: Option<string>): CreateComponentInput {
  return { document: setupDocument(), singleName };
}

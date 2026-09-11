import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";

/**
 * ストーリー用のサンプルドキュメント。選択の対象になりうる 3 つ（artboard・プリミティブ
 * のノード・インスタンス）を 1 枚に揃えてある。
 *
 * トークンと部品は雛形をそのまま使うので、`primary-button` との名前の重複判定もこの 1 枚で
 * 確かめられる。
 */
export const SampleAssetsDocument = DesignDocument.create({
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

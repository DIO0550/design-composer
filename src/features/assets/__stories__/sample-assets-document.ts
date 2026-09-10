import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";

/**
 * ストーリー用のサンプルドキュメント。選択の対象になりうる 3 つ（artboard・プリミティブのノード・インスタンス）を
 * 1 枚に揃えてある。
 *
 * 部品化のパネルが 4 状態（`ready` / `instance` / `artboard` / `unselected`）を出し分けるところを 1 つのドキュメント
 * から見るため。トークンと部品は雛形をそのまま使うので、`primary-button` との名前の重複判定もこの 1 枚で確かめられる。
 *
 * `features/editor` のサンプル状態（`SampleEditorState`）を持ってこないのは、あちらの 3 枚の artboard がキャンバスの
 * 配置を映すためのもので、パレット側で見たいものと違うから。
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

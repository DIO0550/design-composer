import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";

/**
 * ストーリー用のサンプルドキュメント。
 *
 * 選択の対象になりうる 3 つ（artboard・プリミティブのノード・インスタンス）を 1 枚に
 * 揃えて、部品化のパネルが 4 状態（`ready` / `instance` / `artboard` / `unselected`）
 * を出し分けるところを 1 つのドキュメントから見られるようにしている。トークンと部品は
 * 雛形（`DocumentTemplate.Default`）をそのまま使い、`primary-button` があるので既に
 * 使われている名前の重複判定もこの 1 枚で確かめられる。
 *
 * Why not: `features/editor` のサンプル状態（`SampleEditorState`）を持ってこない。
 * 3 枚の artboard を持つのはキャンバスの配置（はみ出し・部品の並び）を映すためで、
 * このパレット側で見たいものが違う。
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

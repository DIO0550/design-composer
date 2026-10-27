import { DesignDocument } from "@/domains/dcmp/design-document";

/**
 * 複製・コピーの元にするノードが並ぶドキュメント。
 *
 * `screen` の下に Text・子を持つ Box・部品インスタンス・Text が並び、Box の中にも Text が 2 つ
 * 並ぶ。別の artboard `about` にも Text を 1 つ持ち、部品定義の中にもノードを 1 つ持つ。
 *
 * 複製元には後ろに兄弟がいるもの（`title` `card` `caption` `login`）を選べるようにしておく。
 * 末尾のノードでは「親の末尾へ入れる」実装とも同じ結果になり、直後へ入ることを確かめられない。
 *
 * @returns 上の木を持つドキュメント
 */
export function copySourceDocument(): DesignDocument {
  return DesignDocument.create({
    components: {
      "primary-button": {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
      },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text" },
          {
            name: "card",
            type: "Box",
            children: [
              { name: "caption", type: "Text" },
              { name: "note", type: "Text" },
            ],
          },
          { name: "login", ref: "primary-button" },
          { name: "footer", type: "Text" },
        ],
      },
      {
        name: "about",
        width: 375,
        height: 812,
        children: [{ name: "about-title", type: "Text" }],
      },
    ],
  });
}

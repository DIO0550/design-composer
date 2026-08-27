import { Artboard } from "@/domains/dcmp/artboard";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";

/**
 * テストで開くドキュメント。
 *
 * 雛形のトークン・部品に artboard を 2 枚足したもので、ツリービュー・キャンバス・
 * プロパティパネルのどれからでも同じ中身を辿れる状態にしてある。
 */
export const SampleDocument = DesignDocument.create({
  tokens: DocumentTemplate.Default.tokens,
  components: DocumentTemplate.Default.components,
  artboards: [
    Artboard.create({
      name: "home",
      width: 360,
      height: 240,
      props: {
        direction: "column",
        gap: "md",
        paddingTop: "lg",
        paddingRight: "lg",
        paddingBottom: "lg",
        paddingLeft: "lg",
        background: "white",
      },
      children: [
        {
          name: "home-title",
          type: "Text",
          props: { content: "ホーム", typography: "heading" },
        },
        {
          name: "home-login",
          ref: "primary-button",
          overrides: { label: "ログイン" },
        },
      ],
    }),
    Artboard.create({
      name: "settings",
      width: 360,
      height: 240,
      props: {
        direction: "column",
        gap: "md",
        paddingTop: "lg",
        paddingRight: "lg",
        paddingBottom: "lg",
        paddingLeft: "lg",
        background: "gray-100",
      },
      children: [
        {
          name: "settings-card",
          ref: "card",
          overrides: { title: "設定", body: "通知とテーマを変更できます" },
        },
      ],
    }),
  ],
});

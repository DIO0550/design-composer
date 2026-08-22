import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import type { DocumentError } from "@/domains/document-error";
import { EditorState } from "@/features/editor/domains/editor-state";

/**
 * ストーリー用のサンプル状態。
 * 雛形のトークン・部品に artboard を 3 枚足したものを、状態を持つ
 * ペインのストーリーで共有する（同じ組み立てを各ストーリーに重複させない）。
 *
 * 3 枚目は中身が artboard より大きく、はみ出しがデフォルトで clip されることを
 * 目で確認できるようにしている（docs/01「はみ出し: …デフォルトで clip」）。
 */
export const SampleEditorState = EditorState.create(
  DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      {
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
      },
      {
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
      },
      {
        name: "overflow",
        width: 240,
        height: 160,
        props: {
          paddingTop: "md",
          paddingRight: "md",
          paddingBottom: "md",
          paddingLeft: "md",
          background: "white",
        },
        children: [
          {
            name: "overflow-wide",
            type: "Box",
            props: {
              widthMode: "fixed",
              width: 480,
              heightMode: "fixed",
              height: 320,
              background: "primary",
              radius: "md",
            },
            children: [],
          },
        ],
      },
    ],
  }),
);

/**
 * 外部エディタがファイルを壊したときに届くエラー。UI 案の Error 画面が 2 件なので
 * 件数も揃える（上部バーのバッジが `2 件のエラー` になる）。
 *
 * 使うのは上部バー単体のストーリー（件数だけを必要とする）。
 */
export const SampleFileErrors: readonly DocumentError[] = [
  {
    kind: "syntax-error",
    message: "expected ',' or '}'",
    location: { kind: "text-position", position: 47 },
  },
  {
    kind: "dangling-ref",
    message: "colors.brand-red が見つからない",
    location: { kind: "node", nodeName: "home-title", prop: "typography" },
  },
];

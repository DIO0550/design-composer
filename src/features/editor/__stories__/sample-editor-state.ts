import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";

/**
 * ストーリー用のサンプル状態。
 * 雛形のトークン・部品に artboard を 3 枚足したものを、状態を持つ
 * ペインのストーリーで共有する（同じ組み立てを各ストーリーに重複させない）。
 *
 * 3 枚目は中身が artboard より大きく、はみ出しがデフォルトで clip されることを
 * 目で確認できるようにしている（docs/01「はみ出し: …デフォルトで clip」）。
 */
export const SAMPLE_EDITOR_STATE = EditorState.create(
  DesignDocument.create({
    tokens: DocumentTemplate.DEFAULT.tokens,
    components: DocumentTemplate.DEFAULT.components,
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        props: {
          direction: "column",
          gap: "md",
          paddingX: "lg",
          paddingY: "lg",
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
          paddingX: "lg",
          paddingY: "lg",
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
        props: { paddingX: "md", paddingY: "md", background: "white" },
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

/** artboard も部品も持たないドキュメントの状態（空表示の確認用）。 */
export const EMPTY_EDITOR_STATE = EditorState.create(
  DesignDocument.create({ artboards: [] }),
);

import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { DocumentSelection } from "@/domains/document-selection";

/**
 * 左ペインのストーリー用のサンプルドキュメント。
 *
 * 雛形のトークン・部品に artboard を 2 枚足してある。3 つの行き先が 1 つのドキュメントで
 * 揃うようにしていて、Layers は 2 枚の artboard とその中身、Assets は雛形の部品、
 * Tokens は雛形のトークンを映す。ツリー都合の構造（入れ子の深さ・並べ替えボタンの出方）は
 * それを見たいストーリーの側に置く。
 *
 * Why not: `features/editor` のサンプル状態（`SampleEditorState`）は持ってこない。
 * この feature は編集画面を知らないので import できず、あちらはキャンバスの配置
 * （はみ出しの clip など）を映すためのドキュメントで目的が違う。
 */
export const SampleSidebarDocument = DesignDocument.create({
  tokens: DocumentTemplate.Default.tokens,
  components: DocumentTemplate.Default.components,
  artboards: [
    {
      name: "home",
      width: 360,
      height: 240,
      props: { direction: "column", gap: "md", background: "white" },
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
      props: { direction: "column", gap: "md", background: "gray-100" },
      children: [
        {
          name: "settings-card",
          ref: "card",
          overrides: { title: "設定", body: "通知とテーマを変更できます" },
        },
      ],
    },
  ],
});

/**
 * サンプルドキュメントの中で、その名前を選んでいる対。
 *
 * @param names 選んでいるものの名前。省略すると何も選んでいない対になる
 * @returns 左ペインへ渡す選択とドキュメントの対
 */
export function sampleSidebarSelection(
  ...names: readonly string[]
): DocumentSelection {
  return DocumentSelection.fromNames(SampleSidebarDocument, names);
}

/** artboard も部品も持たないドキュメントの対（空表示の確認用）。 */
export const EmptySidebarSelection = DocumentSelection.fromNames(
  DesignDocument.create({ artboards: [] }),
  [],
);

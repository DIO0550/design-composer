import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/document-selection";

/**
 * キャンバスのストーリー用のサンプルドキュメント。
 *
 * 雛形のトークン・部品に artboard を 3 枚足してあり、キャンバスが映すものが
 * 1 つのドキュメントで揃う。1 枚目に部品インスタンス（`home-login`）と
 * トークンを参照するノード（`home-title`）、3 枚目に**中身が artboard より大きい**
 * ノードを置いて、はみ出しがデフォルトで clip されることを目で確認できるようにしている
 * （docs/01「はみ出し: …デフォルトで clip」）。
 *
 * Why not: `features/editor` のサンプル状態（`SampleEditorState`）は持ってこない。
 * この feature は編集画面を知らないので import できない（`canvas -> editor` の辺を
 * 作ると循環する）。
 */
export const SampleCanvasDocument = DesignDocument.create({
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
});

/** artboard を 1 枚も持たないドキュメント（空表示の確認用）。 */
export const EmptyCanvasDocument = DesignDocument.create({ artboards: [] });

/**
 * サンプルドキュメントと、その中で選ばれているものの対。
 *
 * @param names 選ばれているものの名前。省略すると未選択
 * @returns サンプルドキュメントと選択の対
 */
export function sampleCanvasSelection(
  names: readonly string[] = [],
): DocumentSelection {
  return DocumentSelection.fromNames(SampleCanvasDocument, names);
}

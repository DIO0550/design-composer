import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import type { TokenRef } from "@/domains/dcmp/token";
import { TokenSelection } from "@/domains/session/token-selection";
import { Option } from "@/utils/Option";

/**
 * ストーリー用のサンプルドキュメント。
 *
 * トークンと部品は雛形のものをそのまま使い、artboard は**参照元の見え方**だけを狙って
 * 組んでいる（`primary` はキャンバス上 1 件、`gray-900` は 2 件、`danger` は 0 件、
 * `md` は上限を超える件数）。
 *
 * Why not: `features/editor` のサンプル状態（`SampleEditorState`）を持ってこない。
 * あちらが 3 枚の artboard を持つのはキャンバスの配置（はみ出し・部品の並び）を映すためで、
 * 見たいものが違う。写すと片方だけ直る形になる。
 */
export const SampleTokenDocument = DesignDocument.create({
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
          props: {
            content: "ホーム",
            typography: "heading",
            color: "gray-900",
          },
        },
        {
          name: "home-caption",
          type: "Text",
          props: { content: "説明", color: "gray-900" },
        },
        {
          name: "home-panel",
          type: "Box",
          props: { background: "primary", radius: "md" },
          children: [],
        },
      ],
    },
  ],
});

/**
 * サンプルドキュメントのトークンを 1 つ選んだ状態。
 *
 * @param ref 選ぶトークンの種別と名前
 * @returns そのトークンを選んでいる選択
 */
export function sampleTokenSelection(ref: TokenRef): TokenSelection {
  return TokenSelection.create(SampleTokenDocument, Option.some(ref));
}

/** サンプルドキュメントで何も選んでいない状態。 */
export const NoTokenSelection = TokenSelection.create(
  SampleTokenDocument,
  Option.none,
);

import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";

/**
 * ストーリー用のサンプル状態。
 * 雛形のトークン・部品に artboard を 2 枚足したものを、状態を持つ
 * ペインのストーリーで共有する（同じ組み立てを各ストーリーに重複させない）。
 */
export const SAMPLE_EDITOR_STATE = EditorState.create(
  DesignDocument.create({
    tokens: DocumentTemplate.DEFAULT.tokens,
    components: DocumentTemplate.DEFAULT.components,
    artboards: [
      { name: "home", width: 360, height: 240, children: [] },
      { name: "settings", width: 360, height: 240, children: [] },
    ],
  }),
);

/** artboard も部品も持たないドキュメントの状態（空表示の確認用）。 */
export const EMPTY_EDITOR_STATE = EditorState.create(
  DesignDocument.create({ artboards: [] }),
);

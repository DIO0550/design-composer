import { render } from "@testing-library/react";
import type { DesignDocument } from "@/domains/design-document";
import type { TokenRef } from "@/domains/token";
import { EditorState } from "@/features/editor/domains/editor-state";
import { TokenUsedBy } from "../index";

/**
 * トークンを選んだ状態の `Used by` を描く。
 * 参照元は選択中のトークンから決まるので、どのテストも「ドキュメントを作って選ぶ」から始まる。
 * 観点ごとに土台のドキュメントが違う（正常系と件数の上限）ため、ドキュメントは引数で受け取る。
 */
export function renderUsedBy(document: DesignDocument, ref: TokenRef): void {
  render(
    <TokenUsedBy
      state={EditorState.selectToken(EditorState.create(document), ref)}
    />,
  );
}

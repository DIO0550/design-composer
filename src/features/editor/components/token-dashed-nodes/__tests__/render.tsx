import { render } from "@testing-library/react";
import type { DesignDocument } from "@/domains/design-document";
import type { TokenRef } from "@/domains/token";
import { EditorState } from "@/features/editor/domains/editor-state";
import { TokenDashedNodes } from "../index";

/**
 * トークンを選んだ状態の帯を描く。
 * 出る中身は選択中のトークンから決まるので、どのテストも「ドキュメントを作って選ぶ」から始まる。
 * 観点ごとに土台のドキュメントが違うため、ドキュメントは引数で受け取る。
 */
export function renderDashedNodes(
  document: DesignDocument,
  ref: TokenRef,
): void {
  render(
    <TokenDashedNodes
      state={EditorState.selectToken(EditorState.create(document), ref)}
    />,
  );
}

/**
 * トークンを選んでいない状態の帯を描く。
 * 選択が無いことと参照が 0 件であることは別の入力なので、選ぶ側と分けて持つ。
 */
export function renderWithoutSelection(document: DesignDocument): void {
  render(<TokenDashedNodes state={EditorState.create(document)} />);
}

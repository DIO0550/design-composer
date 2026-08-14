import { render } from "@testing-library/react";
import type { DesignDocument } from "@/domains/design-document";
import type { TokenRef } from "@/domains/token";
import { EditorState } from "@/features/editor/domains/editor-state";
import { TokenCanvasLegend } from "../index";

/**
 * トークンを選んだ状態の帯を描く。
 * 出る中身は選択中のトークンから決まるので、どのテストも「ドキュメントを作って選ぶ」から始まる。
 * 観点ごとに土台のドキュメントが違うため、ドキュメントは引数で受け取る。
 */
export function renderLegend(document: DesignDocument, ref: TokenRef): void {
  render(
    <TokenCanvasLegend
      state={EditorState.selectToken(EditorState.create(document), ref)}
    />,
  );
}

/**
 * トークンを選んでいない状態の帯を描く。
 * 選択が無いことと参照が 0 件であることは別の入力なので、選ぶ側と分けて持つ。
 */
export function renderLegendWithoutSelection(document: DesignDocument): void {
  render(<TokenCanvasLegend state={EditorState.create(document)} />);
}

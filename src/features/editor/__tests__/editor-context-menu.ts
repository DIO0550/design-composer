import { fireEvent, within } from "@testing-library/react";
import { contextMenu } from "@/components/__tests__/context-menu";
import { tree } from "@/features/editor/__tests__/pane-regions";

/*
 * 編集画面のコンテキストメニューを開いて行を引く。
 *
 * `opened-document-editor` と `editor-screen` の両方のテストが同じ開き方・引き方をするため、
 * モジュールの外へ出してある（`pane-regions` と同じ形）。
 */

/**
 * 要素を右クリックする。
 *
 * @param target 押す要素
 * @param at 押した窓の座標。省くと折り返しの起きない位置
 */
export function rightClick(
  target: Element,
  at: Readonly<{ x: number; y: number }> = { x: 120, y: 80 },
): void {
  fireEvent.contextMenu(target, { clientX: at.x, clientY: at.y });
}

/**
 * ツリーの行を右クリックする。同じ名前はキャンバスにも出るのでツリーに絞る。
 *
 * @param name 押す行の名前
 * @param at 押した窓の座標。省くと折り返しの起きない位置
 */
export function rightClickInTree(
  name: string,
  at?: Readonly<{ x: number; y: number }>,
): void {
  rightClick(within(tree()).getByRole("button", { name }), at);
}

/**
 * コンテキストメニューの行。
 *
 * @param label 行の綴り。読み上げ名は綴りのうしろに割り当てが並ぶので前方一致で引く
 * @returns その行のボタン
 */
export function menuRow(label: string): HTMLElement {
  return within(contextMenu()).getByRole("menuitem", {
    name: new RegExp(`^${label}`),
  });
}

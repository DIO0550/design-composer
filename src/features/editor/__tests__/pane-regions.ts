import { screen } from "@testing-library/react";

/**
 * 3 ペインの中の領域を引く。
 *
 * 引くのは編集画面を組み立てているこの feature の関心事で、`opened-document-editor` と
 * `editor-screen` の両方のテストが同じものを見るため、モジュールの外へ出してある。
 */

/**
 * ツリーの領域。行を読む相手はここに絞る。
 *
 * 左ペインにはレールの行き先ボタンも並び、そちらも `aria-current` を持つため、ペイン全体
 * を渡すと行き先が行として混ざる（`row-names` の注意書きのとおり）。
 *
 * @returns 見えているツリーの領域
 */
export function tree(): HTMLElement {
  return screen.getByRole("region", { name: "ツリー" });
}

/**
 * artboard の一覧の領域。artboard はツリーの行ではなく上段の一覧に並ぶので、選ぶのも今どれ
 * を見ているかを読むのもこちらから行う。
 *
 * @returns 見えている artboard 一覧の領域
 */
export function artboardList(): HTMLElement {
  return screen.getByRole("region", { name: "artboard 一覧" });
}

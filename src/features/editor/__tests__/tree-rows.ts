import { within } from "@testing-library/react";

/**
 * ツリービューに並んでいる行を読む。
 * ツリー単体（components/document-tree）とエディタ画面（components/editor-screen）の
 * 両方が「並びがどう見えているか」を確かめるため、feature 直下に置いて共有する。
 *
 * 行は名前のほかに型アイコンと補助情報も出すため、名前は表示文字列ではなく
 * 読み上げ名（`aria-label`）から読む。
 */

/** 並べ替えボタンのラベル。名前の行と区別するために使う。 */
const REORDER_LABEL = /を(上|下)へ$/;

function rows(tree: HTMLElement): readonly HTMLElement[] {
  return within(tree)
    .getAllByRole("button")
    .filter(
      (button) => !REORDER_LABEL.test(button.getAttribute("aria-label") ?? ""),
    );
}

function nameOf(row: HTMLElement): string {
  return row.getAttribute("aria-label") ?? "";
}

/** 画面に出ている順の行の名前。 */
export function treeRowNames(tree: HTMLElement): readonly string[] {
  return rows(tree).map(nameOf);
}

/** 選択状態になっている行の名前。 */
export function selectedTreeRowNames(tree: HTMLElement): readonly string[] {
  return rows(tree)
    .filter((row) => row.getAttribute("aria-current") === "true")
    .map(nameOf);
}

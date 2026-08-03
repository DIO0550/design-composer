import { within } from "@testing-library/react";

/**
 * ツリービューに並んでいる行の名前を、画面に出ている順で読む。
 * ツリー単体（components/document-tree）とエディタ画面（components/editor-screen）の
 * 両方が「並びがどう見えているか」を確かめるため、feature 直下に置いて共有する。
 */

/** 並べ替えボタンのラベル。名前の行と区別するために使う。 */
const REORDER_LABEL = /を(上|下)へ$/;

export function treeRowNames(tree: HTMLElement): readonly string[] {
  return within(tree)
    .getAllByRole("button")
    .filter(
      (button) => !REORDER_LABEL.test(button.getAttribute("aria-label") ?? ""),
    )
    .map((button) => button.textContent ?? "");
}

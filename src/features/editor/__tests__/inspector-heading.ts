import { screen, within } from "@testing-library/react";

/**
 * 右ペインの見出しの帯を読む。
 * `property-panel` / `token-editor` / 編集画面のどれもが同じ読み方をするため、
 * feature 直下に置いて共有する（rules/testing.md「テスト用ヘルパーの置き場所」）。
 */

/**
 * 帯そのもの。何も選んでいないときは中身が空になり、読み上げ名も見出しも持たない。
 * それでも「帯が残っている」ことを確かめられるよう、目印で引く。
 */
export function rightPaneHeading(): HTMLElement {
  return screen.getByTestId("right-pane-heading");
}

/** 帯に出ている名前の見出し。名前そのものは `textContent` で読む。 */
export function headingOfName(): HTMLElement {
  return within(rightPaneHeading()).getByRole("heading", { level: 2 });
}

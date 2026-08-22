import { screen } from "@testing-library/react";

/**
 * 右ペインの見出しの帯（`EditorLayout.RightPane.Heading`）を読む。
 *
 * 帯そのものは編集画面の器なので、読み方もこの feature に置く。中身
 * （`PropertyPanel.Title` / `TokenEditor.Title`）はそれぞれの feature が持っており、
 * ここから引くのは**帯が残っているか**だけ。
 */

/**
 * 帯そのもの。何も選んでいないときは中身が空になり、読み上げ名も見出しも持たない。
 * それでも「帯が残っている」ことを確かめられるよう、目印で引く。
 */
export function rightPaneHeading(): HTMLElement {
  return screen.getByTestId("right-pane-heading");
}

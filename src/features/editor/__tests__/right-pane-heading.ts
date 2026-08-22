import { screen } from "@testing-library/react";

/**
 * 右ペインの見出しの帯（`EditorLayout.RightPane.Heading`）を読む。
 *
 * 帯そのものは編集画面の器なので、読み方もこの feature に置く。引くのは
 * 帯が残っているかと、帯の中に何が出ているか（中身を作るのは
 * `PropertyPanel.Title` / `TokenEditor.Title` で、それぞれの feature が持つ）。
 */

/**
 * 帯そのもの。何も選んでいないときは中身が空になり、読み上げ名も見出しも持たない。
 * それでも「帯が残っている」ことを確かめられるよう、目印で引く。
 */
export function rightPaneHeading(): HTMLElement {
  return screen.getByTestId("right-pane-heading");
}

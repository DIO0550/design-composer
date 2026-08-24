import { screen } from "@testing-library/react";
import { PaneHeadingTestId } from "@/components/pane-heading";

/**
 * 右ペインの見出しの帯（`PaneHeading`）を読む。
 *
 * 帯を右ペインへ着せているのは編集画面なので、読み方もこの feature に置く。引くのは
 * 帯が残っているかと、帯の中に何が出ているか（中身を作るのは
 * `PropertyPanel.Title` / `TokenEditor.Title` で、それぞれの feature が持つ）。
 */

/**
 * 帯そのもの。何も選んでいないときは中身が空になり、読み上げ名も見出しも持たない。
 * それでも「帯が残っている」ことを確かめられるよう、目印で引く。
 *
 * 目印は帯そのものが持つ汎用のものなので、編集画面に `PaneHeading` が 1 つしか
 * 出ていないことに乗っている。2 つ目が出れば `getByTestId` が落ちるので、黙っては壊れない。
 */
export function rightPaneHeading(): HTMLElement {
  return screen.getByTestId(PaneHeadingTestId);
}

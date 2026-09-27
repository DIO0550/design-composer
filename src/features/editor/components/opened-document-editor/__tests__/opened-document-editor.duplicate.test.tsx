import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { rowNames } from "@/components/__tests__/row-names";
import {
  renderOpenedDocument,
  selectArtboard,
  selectInTree,
  tree,
} from "./setup";

/*
 * 複製を、編集画面の配線ごと確かめる（docs/06-ui.md「編集操作の一覧」）。
 *
 * ここが見るのはキーボードの割り当てからの経路（メニューの行からの経路は
 * `opened-document-editor.context-menu`）。`EditorState` 単体のテストでは
 * 画面との繋がり（割り当ての登録）を通らない。
 */

/** 開いた直後のツリーの行（今見ている artboard = home の配下）。 */
const OriginalRows = ["home-title", "home-login"];

test("ノードを選んで Ctrl+D を押すと、その直後に複製が並ぶ", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");

  await userEvent.keyboard("{Control>}d{/Control}");

  expect(rowNames(tree())).toEqual([
    "home-title",
    "home-title-2",
    "home-login",
  ]);
});

test("artboard を選んで Ctrl+D を押してもツリーは変わらない", async () => {
  await renderOpenedDocument();
  await selectArtboard("home");

  await userEvent.keyboard("{Control>}d{/Control}");

  expect(rowNames(tree())).toEqual(OriginalRows);
});

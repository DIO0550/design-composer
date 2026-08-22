import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { rowNames } from "@/components/__tests__/row-names";
import { renderOpenedDocument, selectInTree, tree } from "./setup";

/*
 * 削除を編集画面の配線ごと確かめる（docs/06-ui.md「編集操作の一覧」/ #39）。
 * 入口がキーボードだけになった（#112）ので、ここを通さないと「押すと実際に消える」を
 * 守るテストが無くなる（`use-delete-shortcut` 側は受け口へ届くところまでしか見ない）。
 */

test("選択して Delete を押すとツリーからそのノードが消える", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");

  await userEvent.keyboard("{Delete}");

  expect(rowNames(tree())).toEqual(["home-login"]);
});

test("何も選んでいないときに Delete を押しても並びは変わらない", async () => {
  await renderOpenedDocument();

  await userEvent.keyboard("{Delete}");

  expect(rowNames(tree())).toEqual(["home-title", "home-login"]);
});

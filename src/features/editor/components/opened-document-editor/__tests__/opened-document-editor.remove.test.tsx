import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { rowNames } from "@/features/editor/__tests__/row-names";
import { renderOpenedDocument, selectInTree, tree } from "./setup";

/*
 * 削除を、編集画面の配線ごと確かめる（docs/06-ui.md「編集操作の一覧」の削除 / #39）。
 *
 * 削除の入口はキーボードだけになった（UI 案 docs/Design Composer.html がボタンを
 * 持たないため / #112）ので、ここを通さないと「キーを押すと実際に消える」が
 * どこでも守られない。`use-delete-shortcut` 側のテストが見ているのは、
 * キーの組み合わせが受け口へ届くところまで。
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

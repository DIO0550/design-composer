import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { treeRowNames } from "@/features/editor/__tests__/tree-rows";
import { renderOpenedDocument } from "./setup";

/*
 * コピー & ペーストと部品インスタンスの挿入を、編集画面の配線ごと確かめる
 * （docs/06-ui.md「編集操作の一覧」/ #40）。
 *
 * どちらもキーボードまたは部品一覧からしか届かない操作で、`EditorState` 単体の
 * テストでは画面との繋がり（ショートカットの登録・部品名からインスタンスの指定を
 * 組み立てる部分）を通らない。
 */

/** 開いた直後のツリーの行（artboard 2 枚とその配下）。 */
const ORIGINAL_ROWS = [
  "home",
  "home-title",
  "home-login",
  "settings",
  "settings-card",
];

function tree(): HTMLElement {
  return screen.getByRole("region", { name: "ツリー" });
}

/** ツリーの行を名前で押して選ぶ。同じ名前はキャンバスにも出るのでツリーに絞る。 */
async function selectInTree(name: string): Promise<void> {
  await userEvent.click(within(tree()).getByRole("button", { name }));
}

test("配下のノードをコピーして貼ると自動で採番された複製が増える", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");
  await userEvent.keyboard("{Control>}c{/Control}");

  await selectInTree("home");
  await userEvent.keyboard("{Control>}v{/Control}");

  expect(treeRowNames(tree())).toEqual([
    "home",
    "home-title",
    "home-login",
    "home-title-2",
    "settings",
    "settings-card",
  ]);
});

test("artboard を選んでコピーしても貼れるものは増えない", async () => {
  await renderOpenedDocument();
  await selectInTree("home");

  await userEvent.keyboard("{Control>}c{/Control}");
  await userEvent.keyboard("{Control>}v{/Control}");

  // artboard はノードとして貼れない（複製は artboard 操作の担当 / #43）。
  expect(treeRowNames(tree())).toEqual(ORIGINAL_ROWS);
});

test("コピーしていない状態で Ctrl+V を押してもツリーは変わらない", async () => {
  await renderOpenedDocument();
  await selectInTree("home");

  await userEvent.keyboard("{Control>}v{/Control}");

  expect(treeRowNames(tree())).toEqual(ORIGINAL_ROWS);
});

test("部品一覧の挿入を押すとその部品のインスタンスが選択位置の子として増える", async () => {
  await renderOpenedDocument();
  await selectInTree("home");

  await userEvent.click(screen.getByRole("button", { name: "card を挿入" }));

  /*
   * 名前は `card` ではなく `card-2`。部品名もドキュメントの単一名前空間に属するので、
   * 部品定義の `card` と衝突しないよう採番される（docs/01-file-format.md）。
   */
  expect(treeRowNames(tree())).toEqual([
    "home",
    "home-title",
    "home-login",
    "card-2",
    "settings",
    "settings-card",
  ]);
});

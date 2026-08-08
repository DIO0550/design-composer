import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { rowNames } from "@/features/editor/__tests__/row-names";
import { renderOpenedDocument } from "./setup";

/*
 * コピー & ペーストを、編集画面の配線ごと確かめる
 * （docs/06-ui.md「編集操作の一覧」/ #40）。
 *
 * キーボードからしか届かない操作なので、`EditorState` 単体のテストでは
 * 画面との繋がり（ショートカットの登録）を通らない。
 */

/** 開いた直後のツリーの行（今見ている artboard = home の配下）。 */
const ORIGINAL_ROWS = ["home-title", "home-login"];

function tree(): HTMLElement {
  return screen.getByRole("region", { name: "ツリー" });
}

/** ツリーの行を名前で押して選ぶ。同じ名前はキャンバスにも出るのでツリーに絞る。 */
async function selectInTree(name: string): Promise<void> {
  await userEvent.click(within(tree()).getByRole("button", { name }));
}

/** artboard の一覧から選ぶ。artboard はツリーの行ではないのでこちらから押す。 */
async function selectArtboard(name: string): Promise<void> {
  await userEvent.click(
    within(screen.getByRole("region", { name: "artboard 一覧" })).getByRole(
      "button",
      { name },
    ),
  );
}

test("配下のノードをコピーして貼ると自動で採番された複製が増える", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");
  await userEvent.keyboard("{Control>}c{/Control}");

  await selectArtboard("home");
  await userEvent.keyboard("{Control>}v{/Control}");

  expect(rowNames(tree())).toEqual([
    "home-title",
    "home-login",
    "home-title-2",
  ]);
});

test("artboard を選んでコピーしても貼れるものは増えない", async () => {
  await renderOpenedDocument();
  await selectArtboard("home");

  await userEvent.keyboard("{Control>}c{/Control}");
  await userEvent.keyboard("{Control>}v{/Control}");

  // artboard はノードとして貼れない（複製は artboard 操作の担当 / #43）。
  expect(rowNames(tree())).toEqual(ORIGINAL_ROWS);
});

test("コピーしていない状態で Ctrl+V を押してもツリーは変わらない", async () => {
  await renderOpenedDocument();
  await selectArtboard("home");

  await userEvent.keyboard("{Control>}v{/Control}");

  expect(rowNames(tree())).toEqual(ORIGINAL_ROWS);
});

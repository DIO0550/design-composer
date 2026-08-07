import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { renderOpenedDocument } from "./setup";

/*
 * プロパティパネルからの props 編集を、編集画面の配線ごと確かめる
 * （docs/06-ui.md「編集操作の一覧」の props 編集）。
 *
 * パネル単体のテスト（property-panel）は編集が渡ることまでしか見ないので、
 * 渡した編集がドキュメントへ入りキャンバスへ出るところはここでしか通らない。
 */

function tree(): HTMLElement {
  return screen.getByRole("region", { name: "ツリー" });
}

/** ツリーの行を名前で押して選ぶ。同じ名前はキャンバスにも出るのでツリーに絞る。 */
async function selectInTree(name: string): Promise<void> {
  await userEvent.click(within(tree()).getByRole("button", { name }));
}

test("プロパティパネルで文言を変えるとキャンバスの表示が変わる", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");

  await userEvent.clear(screen.getByRole("textbox", { name: "Content" }));
  await userEvent.type(
    screen.getByRole("textbox", { name: "Content" }),
    "ダッシュボード",
  );

  expect(screen.getByText("ダッシュボード")).toBeDefined();
});

test("トークン参照の prop を選び直すとその値がパネルに残る", async () => {
  await renderOpenedDocument();
  await selectInTree("home");

  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Background" }),
    "gray-100",
  );

  expect(screen.getByRole("combobox", { name: "Background" })).toHaveProperty(
    "value",
    "gray-100",
  );
});

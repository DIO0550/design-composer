import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { rowNames } from "@/components/__tests__/row-names";
import { rightPaneHeading } from "@/features/editor/__tests__/right-pane-heading";
import {
  drawn,
  menuRow,
  renderOpenedDocument,
  selectInTree,
  tree,
} from "./setup";

/*
 * 選択を Box で包む / 外すところまでを、編集画面の配線ごと確かめる（docs/06-ui.md「編集
 * 操作の一覧」のグループ化・グループ解除）。
 *
 * 何が起きるかは `editor-state.group.test.ts` が固定するので、ここで見るのは
 * **入口がどちらの操作へ繋がっているか**。割り当てもメニューの行も対応表で配るため、
 * 取り違えても型では落ちない。
 */

test("⌘G を押すと、選んでいるノードが新しい Box の子になる", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");

  await userEvent.keyboard("{Meta>}g{/Meta}");

  expect(rowNames(tree())).toEqual(["box", "home-title", "home-login"]);
});

test("⌘G を押すと、新しい Box が選ばれる", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");

  await userEvent.keyboard("{Meta>}g{/Meta}");

  expect(rightPaneHeading().textContent).toContain("box");
});

test("⌘G のあと ⌘⇧G を押すと、元の並びに戻る", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");
  await userEvent.keyboard("{Meta>}g{/Meta}");

  await userEvent.keyboard("{Meta>}{Shift>}g{/Shift}{/Meta}");

  expect(rowNames(tree())).toEqual(["home-title", "home-login"]);
});

test("メニューの Group を押すと、選んでいるノードが新しい Box の子になる", async () => {
  await renderOpenedDocument();

  fireEvent.contextMenu(drawn("home-title"), { clientX: 120, clientY: 80 });
  await userEvent.click(menuRow("Group"));

  expect(rowNames(tree())).toEqual(["box", "home-title", "home-login"]);
});

test("メニューの Ungroup を押すと、Box の子が親へ戻る", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");
  await userEvent.keyboard("{Meta>}g{/Meta}");

  // 右クリックは押した枝の入口を選ぶので、包んだ Box が対象になる
  fireEvent.contextMenu(drawn("home-title"), { clientX: 120, clientY: 80 });
  await userEvent.click(menuRow("Ungroup"));

  expect(rowNames(tree())).toEqual(["home-title", "home-login"]);
});

test("Group と Ungroup の行には UI 案の綴りの割り当てが併記される", async () => {
  await renderOpenedDocument();

  fireEvent.contextMenu(drawn("home-title"), { clientX: 120, clientY: 80 });

  expect(menuRow("Group").textContent).toContain("⌘G");
  expect(menuRow("Ungroup").textContent).toContain("Shift+⌘G");
});

import { fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { rowNames } from "@/components/__tests__/row-names";
import { Artboard } from "@/domains/dcmp/artboard";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { rightPaneHeading } from "@/features/editor/__tests__/right-pane-heading";
import {
  artboardList,
  canvasPane,
  contextMenu,
  menuRow,
  propertyPane,
  renderOpenedDocument,
  selectInTree,
  tree,
} from "./setup";

/*
 * 左ペインの行の右クリックからメニューを開いて操作するところまでを、編集画面の配線ごと
 * 確かめる（docs/06-ui.md「コンテキストメニュー」の「出る場所はキャンバスとツリー」）。
 *
 * 凍結中に出ないことはここでは確かめられない。左ペインの `inert` が行へ届かせないことで
 * 成り立ち、happy-dom は `inert` をイベントに強制しない（表示確認で見る）。
 */

/**
 * ツリーの行を右クリックする。同じ名前はキャンバスにも出るのでツリーに絞る。
 *
 * @param name 押す行の名前
 */
function rightClickInTree(
  name: string,
  at: Readonly<{ x: number; y: number }> = { x: 120, y: 80 },
): void {
  fireEvent.contextMenu(within(tree()).getByRole("button", { name }), {
    clientX: at.x,
    clientY: at.y,
  });
}

/**
 * `Artboards` の一覧の行を右クリックする。
 *
 * @param name 押す行の artboard の名前
 */
function rightClickInArtboardList(name: string): void {
  fireEvent.contextMenu(within(artboardList()).getByRole("button", { name }), {
    clientX: 120,
    clientY: 80,
  });
}

test("ツリーの行を右クリックすると、そのノードが選ばれる", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");

  rightClickInTree("home-login");

  expect(rightPaneHeading().textContent).toContain("home-login");
});

test("ツリーの行を右クリックすると、ノードのメニューが出る", async () => {
  await renderOpenedDocument();

  rightClickInTree("home-login");

  expect(menuRow("Duplicate")).toBeDefined();
});

test("ツリーの行を右クリックすると、押した位置にメニューが出る", async () => {
  await renderOpenedDocument();

  rightClickInTree("home-login", { x: 140, y: 90 });

  expect(contextMenu().style.left).toBe("140px");
});

test("別のノードを選んでいるときにツリーの行のメニューの Delete を押すと、押した行のノードが消える", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");

  rightClickInTree("home-login");
  await userEvent.click(menuRow("Delete"));

  expect(rowNames(tree())).toEqual(["home-title"]);
});

test("Artboards の行を右クリックすると、並ぶのは名前を変更と削除になる", async () => {
  await renderOpenedDocument();

  rightClickInArtboardList("settings");

  expect(
    within(contextMenu())
      .getAllByRole("menuitem")
      .map((row) => row.textContent),
  ).toEqual([
    expect.stringMatching(/^Rename/),
    expect.stringMatching(/^Delete/),
  ]);
});

test("中のノードを選んでいるときに、その artboard の行を右クリックすると artboard が選ばれる", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");

  rightClickInArtboardList("home");

  expect(rightPaneHeading().textContent).toContain("Artboard");
});

test("中のノードを選んでいるときに、その artboard の行のメニューの Delete を押すと artboard ごと消える", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");

  rightClickInArtboardList("home");
  await userEvent.click(menuRow("Delete"));

  expect(rowNames(artboardList())).toEqual(["settings"]);
});

/** 同じ部品を指すインスタンスを 2 つ持たせ、まとめて選べるようにする。 */
function setupDocumentWithInstances(): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      Artboard.create({
        name: "home",
        width: 360,
        height: 240,
        children: [
          { name: "home-title", type: "Text", props: { content: "ホーム" } },
          {
            name: "home-login",
            ref: "primary-button",
            overrides: { label: "ログイン" },
          },
          {
            name: "home-signup",
            ref: "primary-button",
            overrides: { label: "登録" },
          },
        ],
      }),
    ],
  });
}

test("複数選択の一員の行を右クリックしても、複数選択のまま変わらない", async () => {
  await renderOpenedDocument(setupDocumentWithInstances());
  await userEvent.click(within(canvasPane()).getByText("ログイン"));
  await userEvent.click(
    within(propertyPane()).getByRole("button", {
      name: "Select all 2 instances",
    }),
  );

  rightClickInTree("home-signup");

  expect(
    within(propertyPane()).getByRole("heading", { name: "2 selected" }),
  ).toBeDefined();
});

import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { renderedElement } from "@/features/canvas/__tests__";
import { LeftPaneViews } from "@/features/sidebar";
import {
  canvasPane,
  goTo,
  leftPane,
  renderOpenedDocument,
  selectInTree,
} from "./setup";

/*
 * 選択したサブツリーの部品化を、編集画面の配線ごと確かめる
 * （UI 案 docs/Design Composer.html の `Create component` / docs/06-ui.md「部品化・解除」）。
 *
 * 部品化の入口は `Assets` の下端にしか無く、名前を打つ欄も押せるかどうかも
 * そこにしか無いので、`EditorState` 単体のテストでは画面との繋がりを通らない。
 *
 * ここで見る打ちかけの名前の消え方は、**部品にできないものを選んだとき**の
 * アンマウントによるもの。部品にできる別のノードへ移したときの取り直し（`key`）は
 * `create-component` のテストが持つ（このドキュメントには部品にできるノードが
 * `home-title` しか無いため、ここでは `key` を通れない）。
 */

/** 部品化のボタン。 */
function createButton(): HTMLElement {
  return within(leftPane()).getByRole("button", { name: /Create component/ });
}

/** 部品名を打って作る。ボタンを押して入力欄を開くところから行う。 */
async function createComponentNamed(componentName: string): Promise<void> {
  await userEvent.click(createButton());
  await userEvent.type(
    within(leftPane()).getByRole("textbox", { name: "部品名" }),
    componentName,
  );
  await userEvent.click(createButton());
}

test("Layers を見ている間は部品化の入口が出ない", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");

  /*
   * UI 案（docs/Design Composer.html）が `Create component` を置いているのは
   * `Assets` パネルの下端だけ。同じ選択のまま `Assets` へ切り替えれば押せる状態で
   * 出る（次のテスト）ので、ここで出ないことは入力から自明ではない。
   */
  expect(
    within(leftPane()).queryByRole("button", { name: /Create component/ }),
  ).toBeNull();
});

test("Tokens を見ている間は部品化の入口が出ない", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");

  await goTo(LeftPaneViews.Tokens);

  expect(
    within(leftPane()).queryByRole("button", { name: /Create component/ }),
  ).toBeNull();
});

test("選択中のノードを部品にするとパレットにその部品が並ぶ", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");
  await goTo(LeftPaneViews.Assets);

  await createComponentNamed("title-part");

  expect(within(leftPane()).getByText("title-part")).toBeDefined();
});

test("部品にすると元の位置がその部品のインスタンスになる", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");
  await goTo(LeftPaneViews.Assets);

  await createComponentNamed("title-part");

  /*
   * 選択は同じ名前のまま残り、その中身が参照ノードに変わる。パレットは選択中の
   * インスタンスの出どころに `source of selection` を添えるので、作った部品の行に
   * それが出ていれば「元の位置がこの部品のインスタンスになった」ことになる。
   */
  expect(within(leftPane()).getByText("source of selection")).toBeDefined();
});

test("部品にすると入力欄が閉じる", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");
  await goTo(LeftPaneViews.Assets);

  await createComponentNamed("title-part");

  expect(
    within(leftPane()).queryByRole("textbox", { name: "部品名" }),
  ).toBeNull();
});

test("インスタンスを選び直すと部品化のボタンを押せなくなる", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");
  await goTo(LeftPaneViews.Assets);

  await userEvent.click(within(canvasPane()).getByText("ログイン"));

  expect(createButton().hasAttribute("disabled")).toBe(true);
});

test("部品にできないものを選び直すと打ちかけの部品名が消える", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");
  await goTo(LeftPaneViews.Assets);
  await userEvent.click(createButton());
  await userEvent.type(
    within(leftPane()).getByRole("textbox", { name: "部品名" }),
    "title-part",
  );

  await userEvent.click(renderedElement(canvasPane(), "settings-card"));
  await userEvent.click(renderedElement(canvasPane(), "home-title"));
  await userEvent.click(createButton());

  expect(
    within(leftPane()).getByRole<HTMLInputElement>("textbox", {
      name: "部品名",
    }).value,
  ).toBe("");
});

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { renderedElement } from "@/features/editor/__tests__/canvas-elements";
import {
  LEFT_PANE_VIEW_LABELS,
  LEFT_PANE_VIEWS,
} from "@/features/editor/components/left-pane-rail";
import {
  canvasPane,
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
 * 打ちかけの名前を捨てる仕組み（選択が変わったときの再マウント）も、`key` を
 * 持つのが呼び出し側なのでここでしか確かめられない。
 */

/** レールで `Assets` へ切り替える。部品化の入口はこの行き先にしか無い。 */
async function goToAssets(): Promise<void> {
  await userEvent.click(
    within(
      screen.getByRole("navigation", { name: "左ペインの表示" }),
    ).getByRole("button", {
      name: LEFT_PANE_VIEW_LABELS[LEFT_PANE_VIEWS.assets],
    }),
  );
}

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

test("選択中のノードを部品にするとパレットにその部品が並ぶ", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");
  await goToAssets();

  await createComponentNamed("title-part");

  expect(within(leftPane()).getByText("title-part")).toBeDefined();
});

test("部品にすると元の位置がその部品のインスタンスになる", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");
  await goToAssets();

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
  await goToAssets();

  await createComponentNamed("title-part");

  expect(
    within(leftPane()).queryByRole("textbox", { name: "部品名" }),
  ).toBeNull();
});

test("インスタンスを選び直すと部品化のボタンを押せなくなる", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");
  await goToAssets();

  await userEvent.click(within(canvasPane()).getByText("ログイン"));

  expect(createButton().hasAttribute("disabled")).toBe(true);
});

test("部品にできないものを選び直すと打ちかけの部品名が消える", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");
  await goToAssets();
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

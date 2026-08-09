import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { rowNames } from "@/features/editor/__tests__/row-names";
import {
  LEFT_PANE_VIEW_LABELS,
  LEFT_PANE_VIEWS,
  type LeftPaneView,
} from "@/features/editor/components/left-pane-rail";
import {
  leftPane,
  propertyPane,
  renderOpenedDocument,
  selectArtboard,
  selectInTree,
} from "./setup";

/*
 * 左ペインの行き先の切り替えを、編集画面の配線ごと確かめる
 * （UI 案 docs/Design Composer.html のアイコンレール / #129）。
 *
 * レール単体のテストは「押した行き先が伝わる」ところまでしか見ないので、
 * 行き先ごとに左ペインと右ペインへ何が出るかはここでしか通らない。
 */

/** レールで行き先を選ぶ。綴りではなく行き先で指す（取り違えを型で弾く）。 */
async function goTo(view: LeftPaneView): Promise<void> {
  await userEvent.click(
    within(
      screen.getByRole("navigation", { name: "左ペインの表示" }),
    ).getByRole("button", { name: LEFT_PANE_VIEW_LABELS[view] }),
  );
}

test("開いた直後の左ペインにはツリーが出る", async () => {
  await renderOpenedDocument();

  expect(screen.getByRole("region", { name: "ツリー" })).toBeDefined();
});

test("Assets に切り替えるとパレットの部品が出る", async () => {
  await renderOpenedDocument();

  await goTo(LEFT_PANE_VIEWS.assets);

  expect(within(leftPane()).getByText("primary-button")).toBeDefined();
});

test("Assets に切り替えるとツリーは出なくなる", async () => {
  await renderOpenedDocument();

  await goTo(LEFT_PANE_VIEWS.assets);

  expect(screen.queryByRole("region", { name: "ツリー" })).toBeNull();
});

test("Assets から Layers に戻すとツリーが出る", async () => {
  await renderOpenedDocument();
  await goTo(LEFT_PANE_VIEWS.assets);

  await goTo(LEFT_PANE_VIEWS.layers);

  expect(screen.getByRole("region", { name: "ツリー" })).toBeDefined();
});

test("Assets の部品を挿すと選択位置の子としてインスタンスが増える", async () => {
  await renderOpenedDocument();
  await selectArtboard("home");
  await goTo(LEFT_PANE_VIEWS.assets);

  await userEvent.click(screen.getByRole("button", { name: "card を挿入" }));

  await goTo(LEFT_PANE_VIEWS.layers);
  expect(rowNames(screen.getByRole("region", { name: "ツリー" }))).toEqual([
    "home-title",
    "home-login",
    "card-2",
  ]);
});

/*
 * UI 案は Assets を「Assets is browse-only — the inspector keeps the previous
 * selection」と規定している。切り替えで選択が落ちると、部品を見てから挿す間に
 * 挿し先を選び直すことになる。
 */
test("Assets に切り替えても選択していたノードは右ペインに出たままになる", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");

  await goTo(LEFT_PANE_VIEWS.assets);

  expect(within(propertyPane()).getByText("home-title")).toBeDefined();
});

test("Tokens に切り替えると右ペインがトークンの編集になる", async () => {
  await renderOpenedDocument();

  await goTo(LEFT_PANE_VIEWS.tokens);

  // トークン未選択なので帯には何も出ない。本文の知らせが「トークンの編集になった」印
  expect(
    within(propertyPane()).getByText("トークンが選択されていません"),
  ).toBeDefined();
});

test("パネルの見出しは今いる行き先の名前になる", async () => {
  await renderOpenedDocument();

  await goTo(LEFT_PANE_VIEWS.assets);

  expect(
    within(leftPane()).getByRole("heading", { level: 2 }).textContent,
  ).toBe("Assets");
});

/*
 * インスタンスを選んだときの「元の部品へ移動」（UI 案 docs/Design Composer.html の
 * `Assets · Instance`）。行き先の切り替え・出どころの受け渡し・パレットの強調が
 * 繋がって初めて成立するので、単体のテストでは通らない。
 */
test("インスタンスを選んで元の部品へ移動すると左ペインが Assets になる", async () => {
  await renderOpenedDocument();
  await selectInTree("home-login");

  await userEvent.click(
    within(propertyPane()).getByRole("button", {
      name: "Go to source component",
    }),
  );

  expect(
    within(leftPane()).getByRole("heading", { level: 2 }).textContent,
  ).toBe("Assets");
});

test("インスタンスを選ぶとパレットの元になっている部品の行が出どころとして出る", async () => {
  await renderOpenedDocument();
  await selectInTree("home-login");

  await goTo(LEFT_PANE_VIEWS.assets);

  const sourceRow = within(leftPane())
    .getByText("source of selection")
    .closest("li");
  expect(sourceRow?.textContent).toContain("primary-button");
});

test("インスタンス以外を選んでいるとパレットのどの行も出どころにならない", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");

  await goTo(LEFT_PANE_VIEWS.assets);

  expect(within(leftPane()).queryByText("source of selection")).toBeNull();
});

test("インスタンスを解除するとツリーの行が参照ではなくなる", async () => {
  await renderOpenedDocument();
  await selectInTree("home-login");

  await userEvent.click(
    within(propertyPane()).getByRole("button", { name: "Detach instance" }),
  );

  // 帯の種別は参照ノードなら `Instance`。解除で実体になれば `Box` に変わる
  expect(within(propertyPane()).getByText("Box")).toBeDefined();
});

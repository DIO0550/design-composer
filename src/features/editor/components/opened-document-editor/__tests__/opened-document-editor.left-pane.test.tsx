import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { treeRowNames } from "@/features/editor/__tests__/tree-rows";
import { renderOpenedDocument } from "./setup";

/*
 * 左ペインの行き先の切り替えを、編集画面の配線ごと確かめる
 * （UI 案 docs/Design Composer.html のアイコンレール / #129）。
 *
 * レール単体のテストは「押した行き先が伝わる」ところまでしか見ないので、
 * 行き先ごとに左ペインと右ペインへ何が出るかはここでしか通らない。
 */

function leftPane(): HTMLElement {
  return screen.getByRole("complementary", { name: "左ペイン" });
}

function propertyPane(): HTMLElement {
  return screen.getByRole("complementary", { name: "プロパティパネル" });
}

/** レールで行き先を選ぶ。 */
async function goTo(view: string): Promise<void> {
  await userEvent.click(
    within(
      screen.getByRole("navigation", { name: "左ペインの表示" }),
    ).getByRole("button", { name: view }),
  );
}

/** ツリーの行を名前で押して選ぶ。同じ名前はキャンバスにも出るのでツリーに絞る。 */
async function selectInTree(name: string): Promise<void> {
  await userEvent.click(
    within(screen.getByRole("region", { name: "ツリー" })).getByRole("button", {
      name,
    }),
  );
}

test("開いた直後の左ペインにはツリーが出る", async () => {
  await renderOpenedDocument();

  expect(screen.getByRole("region", { name: "ツリー" })).toBeDefined();
});

test("Assets に切り替えるとパレットの部品が出る", async () => {
  await renderOpenedDocument();

  await goTo("Assets");

  expect(within(leftPane()).getByText("primary-button")).toBeDefined();
});

test("Assets に切り替えるとツリーは出なくなる", async () => {
  await renderOpenedDocument();

  await goTo("Assets");

  expect(screen.queryByRole("region", { name: "ツリー" })).toBeNull();
});

test("Assets から Layers に戻すとツリーが出る", async () => {
  await renderOpenedDocument();
  await goTo("Assets");

  await goTo("Layers");

  expect(screen.getByRole("region", { name: "ツリー" })).toBeDefined();
});

test("Assets の部品を挿すと選択位置の子としてインスタンスが増える", async () => {
  await renderOpenedDocument();
  await selectInTree("home");
  await goTo("Assets");

  await userEvent.click(screen.getByRole("button", { name: "card を挿入" }));

  await goTo("Layers");
  expect(treeRowNames(screen.getByRole("region", { name: "ツリー" }))).toEqual([
    "home",
    "home-title",
    "home-login",
    "card-2",
    "settings",
    "settings-card",
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

  await goTo("Assets");

  expect(within(propertyPane()).getByText("home-title")).toBeDefined();
});

test("Tokens に切り替えると右ペインがトークンの編集になる", async () => {
  await renderOpenedDocument();

  await goTo("Tokens");

  expect(within(propertyPane()).getByText("トークン")).toBeDefined();
});

test("パネルの見出しは今いる行き先の名前になる", async () => {
  await renderOpenedDocument();

  await goTo("Assets");

  expect(
    within(leftPane()).getByRole("heading", { level: 2 }).textContent,
  ).toBe("Assets");
});

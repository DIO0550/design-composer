import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { rowNames } from "@/components/__tests__/row-names";
import { LeftPaneViews } from "@/features/sidebar";
import {
  goTo,
  leftPane,
  propertyPane,
  renderOpenedDocument,
  selectArtboard,
  selectInTree,
  tree,
} from "./setup";

/*
 * 左ペインの行き先の切り替えを、編集画面の配線ごと確かめる
 * （UI 案 docs/Design Composer.html のアイコンレール）。
 *
 * レール単体のテストは「押した行き先が伝わる」ところまでしか見ないので、
 * 行き先ごとに左ペインと右ペインへ何が出るかはここでしか通らない。
 */

test("開いた直後の左ペインにはツリーが出る", async () => {
  await renderOpenedDocument();

  expect(screen.getByRole("region", { name: "ツリー" })).toBeDefined();
});

test("Assets に切り替えるとパレットの部品が出る", async () => {
  await renderOpenedDocument();

  await goTo(LeftPaneViews.Assets);

  expect(within(leftPane()).getByText("primary-button")).toBeDefined();
});

test("Assets に切り替えるとツリーは出なくなる", async () => {
  await renderOpenedDocument();

  await goTo(LeftPaneViews.Assets);

  expect(screen.queryByRole("region", { name: "ツリー" })).toBeNull();
});

test("Assets から Layers に戻すとツリーが出る", async () => {
  await renderOpenedDocument();
  await goTo(LeftPaneViews.Assets);

  await goTo(LeftPaneViews.Layers);

  expect(screen.getByRole("region", { name: "ツリー" })).toBeDefined();
});

/*
 * 検索欄は器（`LeftPanePanel`）が持ち、語は中身へ渡って一覧とツリーを絞る
 * （docs/06-ui.md「絞り込み」）。欄と絞り込みが別のモジュールに分かれたので、
 * 打って絞られるまでが通るのはここだけ。
 */
test("Layers の検索欄に打つと、一致しないツリーの行が消える", async () => {
  await renderOpenedDocument();

  await userEvent.type(
    screen.getByRole("searchbox", { name: "Search layers" }),
    "home-title",
  );

  expect(rowNames(tree())).toEqual(["home-title"]);
});

test("Assets へ行って Layers に戻ると検索語が空に戻る", async () => {
  await renderOpenedDocument();
  await userEvent.type(
    screen.getByRole("searchbox", { name: "Search layers" }),
    "home-title",
  );

  await goTo(LeftPaneViews.Assets);
  await goTo(LeftPaneViews.Layers);

  expect(
    screen.getByRole("searchbox", { name: "Search layers" }),
  ).toHaveProperty("value", "");
});

test("Tokens に切り替えると検索欄は出なくなる", async () => {
  await renderOpenedDocument();

  await goTo(LeftPaneViews.Tokens);

  expect(screen.queryByRole("searchbox")).toBeNull();
});

test("Assets の行は押しても挿さらない", async () => {
  await renderOpenedDocument();
  await selectArtboard("home");
  // ツリーは Layers のときしか出ないので、比べる元をここで読む
  const before = rowNames(screen.getByRole("region", { name: "ツリー" }));
  await goTo(LeftPaneViews.Assets);

  /*
   * UI 案は `Assets` を browse-only とし、挿入をドラッグだけの入口にしている。
   * 運ぶところまで含めた挿入は `opened-document-editor.asset-drag` が見る。
   */
  await userEvent.click(within(leftPane()).getByText("card"));

  await goTo(LeftPaneViews.Layers);
  expect(rowNames(screen.getByRole("region", { name: "ツリー" }))).toEqual(
    before,
  );
});

/*
 * UI 案は Assets を「Assets is browse-only — the inspector keeps the previous
 * selection」と規定している。切り替えで選択が落ちると、部品を見てから挿す間に
 * 挿し先を選び直すことになる。
 */
test("Assets に切り替えても選択していたノードは右ペインに出たままになる", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");

  await goTo(LeftPaneViews.Assets);

  expect(within(propertyPane()).getByText("home-title")).toBeDefined();
});

test("Tokens に切り替えると右ペインがトークンの編集になる", async () => {
  await renderOpenedDocument();

  await goTo(LeftPaneViews.Tokens);

  // トークン未選択なので帯には何も出ない。本文の知らせが「トークンの編集になった」印
  expect(
    within(propertyPane()).getByText("トークンが選択されていません"),
  ).toBeDefined();
});

test("パネルの見出しは今いる行き先の名前になる", async () => {
  await renderOpenedDocument();

  await goTo(LeftPaneViews.Assets);

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

  await goTo(LeftPaneViews.Assets);

  const sourceRow = within(leftPane())
    .getByText("source of selection")
    .closest("li");
  expect(sourceRow?.textContent).toContain("primary-button");
});

test("インスタンス以外を選んでいるとパレットのどの行も出どころにならない", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");

  await goTo(LeftPaneViews.Assets);

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

import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { dragRowNamed } from "@/components/__tests__/row-drag";
import { rowNames } from "@/components/__tests__/row-names";
import { LeftPaneViews } from "@/features/sidebar";
import {
  artboardList,
  breakFileExternally,
  canvasPane,
  goTo,
  leftPane,
  renderOpenedDocument,
  selectArtboard,
  tree,
} from "./setup";

/*
 * artboard の追加・削除・並べ替えを編集画面の配線ごと確かめる（#43）。
 * 追加の入口は `Artboards` の一覧とキャンバスのツールバーの `#`（#316）、
 * 並べ替えは一覧、削除はキーボードだけなので、ここを通さないと「押すと実際に
 * キャンバスが変わる」を守るテストが無くなる。
 *
 * 追加のボタンは 2 箇所にあり読み上げ名も同じなので、引く側は必ずどちらかへ絞る。
 */

/**
 * キャンバスに描かれている artboard の名前を、描かれている順に。
 *
 * 枠は `role="button"` と `aria-current` を持つので、行を読むのと同じ引き方で
 * 拾える（キャンバスのツールバーのボタンは `aria-current` を持たないので混ざらない）。
 */
function canvasArtboardNames(): readonly string[] {
  return rowNames(canvasPane());
}

test("追加のボタンを押すとキャンバスに artboard が1枚増える", async () => {
  await renderOpenedDocument();

  await userEvent.click(
    within(artboardList()).getByRole("button", { name: "artboard を追加" }),
  );

  expect(canvasArtboardNames()).toEqual(["home", "settings", "artboard"]);
});

test("ツールバーの `#` を押してもキャンバスに artboard が1枚増える", async () => {
  await renderOpenedDocument();

  await userEvent.click(
    within(canvasPane()).getByRole("button", { name: "artboard を追加" }),
  );

  expect(canvasArtboardNames()).toEqual(["home", "settings", "artboard"]);
});

/*
 * ツールバーの `#` は押せる条件を持たない（選択に依らない）。それが成り立つのは
 * 凍結中にツールバーごと出ないからなので、消えることをここで留める（#316）。
 * 出たままになると、押しても何も起きないボタンが画面に残る。
 */
test("外部の編集でファイルが壊れている間はキャンバスに artboard の追加ボタンが出ない", async () => {
  const fake = await renderOpenedDocument();

  await breakFileExternally(fake);

  expect(
    within(canvasPane()).queryByRole("button", { name: "artboard を追加" }),
  ).toBeNull();
});

test("追加した artboard の中身をツリーが映す", async () => {
  await renderOpenedDocument();

  await userEvent.click(
    within(artboardList()).getByRole("button", { name: "artboard を追加" }),
  );

  expect(rowNames(tree())).toEqual([]);
});

test("artboard を選んで Delete を押すとキャンバスから消える", async () => {
  await renderOpenedDocument();
  await selectArtboard("home");

  await userEvent.keyboard("{Delete}");

  expect(canvasArtboardNames()).toEqual(["settings"]);
});

test("行を後ろの行の上へ運ぶとキャンバスの並び順が入れ替わる", async () => {
  await renderOpenedDocument();

  dragRowNamed(artboardList(), { from: "home", to: "settings" });

  expect(canvasArtboardNames()).toEqual(["settings", "home"]);
});

test("artboard の一覧にも並べ替えの結果が出る", async () => {
  await renderOpenedDocument();

  dragRowNamed(artboardList(), { from: "home", to: "settings" });

  expect(rowNames(artboardList())).toEqual(["settings", "home"]);
});

test("何も選んでいないときに Delete を押しても artboard は消えない", async () => {
  await renderOpenedDocument();

  await userEvent.keyboard("{Delete}");

  expect(canvasArtboardNames()).toEqual(["home", "settings"]);
});

/*
 * 追加した artboard は選択になるので、続けて Delete を押すとそれだけが消える。
 * 追加が選択を動かさない実装だと `home` が消えて落ちる。
 */
test("追加した直後に Delete を押すと足した1枚だけが消える", async () => {
  await renderOpenedDocument();
  await userEvent.click(
    within(artboardList()).getByRole("button", { name: "artboard を追加" }),
  );

  await userEvent.keyboard("{Delete}");

  expect(canvasArtboardNames()).toEqual(["home", "settings"]);
});

/*
 * `Artboards` の一覧は Layers の中身なので、他の行き先へ移ると追加のボタンごと
 * 消える。初期表示（= Layers）で 1 つあることだけを見ると、どの行き先でも一覧を
 * 描く実装でも通ってしまうため、出ない側を見る。
 *
 * 見るのは左ペインに絞る。キャンバスのツールバーは行き先を変えても出たままなので、
 * 画面全体から引くと、消えたかどうかを見分けられない（#316）。
 */
test("Tokens を映している間は左ペインに追加のボタンが出ない", async () => {
  await renderOpenedDocument();

  await goTo(LeftPaneViews.Tokens);

  expect(
    within(leftPane()).queryByRole("button", { name: "artboard を追加" }),
  ).toBeNull();
});

test("Assets を映している間は左ペインに追加のボタンが出ない", async () => {
  await renderOpenedDocument();

  await goTo(LeftPaneViews.Assets);

  expect(
    within(leftPane()).queryByRole("button", { name: "artboard を追加" }),
  ).toBeNull();
});

test("Layers へ戻すと左ペインに追加のボタンが出る", async () => {
  await renderOpenedDocument();
  await goTo(LeftPaneViews.Tokens);

  await goTo(LeftPaneViews.Layers);

  expect(
    within(leftPane()).getByRole("button", { name: "artboard を追加" }),
  ).toBeDefined();
});

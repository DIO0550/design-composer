import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { rowNames } from "@/features/editor/__tests__/row-names";
import {
  breakFileExternally,
  renderOpenedDocument,
  selectArtboard,
  tree,
} from "./setup";

/*
 * プリミティブの挿入を、編集画面の配線ごと確かめる
 * （docs/06-ui.md「編集操作の一覧」の挿入 / #39）。
 *
 * 挿入は挿入のツールバーからしか届かないので、`EditorState` 単体のテストでは
 * 画面との繋がり（雛形の指定を組み立てる部分）を通らない。
 *
 * インスタンスの挿入は Assets パネルへ移ったので `opened-document-editor.left-pane`
 * が見る（#129）。
 */

/**
 * キャンバス。挿入のボタンを探す相手はここに絞る。絞らないと、ツールバーを左ペインや
 * 上部の帯へ置き戻す実装でも通ってしまい、「キャンバスへ移した」ことを守れない（#112）。
 */
function canvas(): HTMLElement {
  return screen.getByRole("main", { name: "キャンバス" });
}

function leftPane(): HTMLElement {
  return screen.getByRole("complementary", { name: "左ペイン" });
}

test("Box を追加すると選択位置の子として増える", async () => {
  await renderOpenedDocument();
  await selectArtboard("home");

  await userEvent.click(
    within(canvas()).getByRole("button", { name: "Box を追加" }),
  );

  expect(rowNames(tree())).toEqual(["home-title", "home-login", "box"]);
});

test("Text を追加すると選択位置の子として増える", async () => {
  await renderOpenedDocument();
  await selectArtboard("home");

  await userEvent.click(
    within(canvas()).getByRole("button", { name: "Text を追加" }),
  );

  expect(rowNames(tree())).toEqual(["home-title", "home-login", "text"]);
});

test("左ペインには追加のボタンが出ない", async () => {
  await renderOpenedDocument();
  await selectArtboard("home");

  expect(
    within(leftPane()).queryByRole("button", { name: "Box を追加" }),
  ).toBeNull();
});

test("外部の編集でファイルが壊れている間は追加のボタンが出ない", async () => {
  const fake = await renderOpenedDocument();
  await selectArtboard("home");

  await breakFileExternally(fake);

  /*
   * エラー一覧がキャンバスの下端を占めるので、同じ下端に浮かぶツールバーを
   * 出すと重なる。UI 案の Error 画面もツールバーを持たない（#112）。
   */
  expect(
    within(canvas()).queryByRole("button", { name: "Box を追加" }),
  ).toBeNull();
});

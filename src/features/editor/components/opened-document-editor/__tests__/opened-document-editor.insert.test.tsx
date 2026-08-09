import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { rowNames } from "@/features/editor/__tests__/row-names";
import {
  breakFileExternally,
  canvasPane,
  leftPane,
  renderOpenedDocument,
  selectArtboard,
  tree,
} from "./setup";

/*
 * プリミティブの挿入を、編集画面の配線ごと確かめる
 * （docs/06-ui.md「編集操作の一覧」の挿入 / #39）。
 *
 * 挿入は挿入のツールバーからしか届かないので、`EditorState` 単体のテストでは
 * 画面との繋がり（雛形の指定を組み立てる部分・押せるかどうかの配線）を通らない。
 *
 * インスタンスの挿入は Assets パネルへ移ったので `opened-document-editor.left-pane`
 * が見る（#129）。
 */

test("Box を追加すると選択位置の子として増える", async () => {
  await renderOpenedDocument();
  await selectArtboard("home");

  await userEvent.click(
    within(canvasPane()).getByRole("button", { name: "Box を追加" }),
  );

  expect(rowNames(tree())).toEqual(["home-title", "home-login", "box"]);
});

test("Text を追加すると選択位置の子として増える", async () => {
  await renderOpenedDocument();
  await selectArtboard("home");

  await userEvent.click(
    within(canvasPane()).getByRole("button", { name: "Text を追加" }),
  );

  expect(rowNames(tree())).toEqual(["home-title", "home-login", "text"]);
});

test("何も選んでいないときは追加のボタンを押せない", async () => {
  await renderOpenedDocument();

  // 上の 2 件は必ず選んでから押すので、押せるかどうかを `true` に固定しても通る。
  expect(
    within(canvasPane())
      .getByRole("button", { name: "Box を追加" })
      .hasAttribute("disabled"),
  ).toBe(true);
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

  expect(screen.getByRole("alert", { name: "エラー一覧" })).toBeDefined();
  expect(
    within(canvasPane()).queryByRole("button", { name: "Box を追加" }),
  ).toBeNull();
});

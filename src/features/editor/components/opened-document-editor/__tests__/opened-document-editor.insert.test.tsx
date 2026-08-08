import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { rowNames } from "@/features/editor/__tests__/row-names";
import { renderOpenedDocument, selectArtboard, tree } from "./setup";

/*
 * プリミティブの挿入を、編集画面の配線ごと確かめる
 * （docs/06-ui.md「編集操作の一覧」の挿入 / #39）。
 *
 * 挿入は編集操作のボタンからしか届かないので、`EditorState` 単体のテストでは
 * 画面との繋がり（雛形の指定を組み立てる部分）を通らない。
 *
 * インスタンスの挿入は Assets パネルへ移ったので `opened-document-editor.left-pane`
 * が見る（#129）。
 */

test("Box を追加すると選択位置の子として増える", async () => {
  await renderOpenedDocument();
  await selectArtboard("home");

  await userEvent.click(screen.getByRole("button", { name: "Box を追加" }));

  expect(rowNames(tree())).toEqual(["home-title", "home-login", "box"]);
});

test("Text を追加すると選択位置の子として増える", async () => {
  await renderOpenedDocument();
  await selectArtboard("home");

  await userEvent.click(screen.getByRole("button", { name: "Text を追加" }));

  expect(rowNames(tree())).toEqual(["home-title", "home-login", "text"]);
});

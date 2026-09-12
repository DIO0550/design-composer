import { expect, test } from "vitest";
import { EditMenu, EditMenuTargets, EditOperations } from "../index";
import { isRowEnabled, operationsIn, stateSelecting } from "./setup";

/*
 * artboard を右クリックしたときに並ぶものを確かめる
 * （docs/06-ui.md「コンテキストメニュー」の表）。
 *
 * ノードの並びのうち artboard で意味を持つのは削除だけ（コピーは貼る先がどのノードの子にも
 * なれず、並べ替えは一覧の担当、解除はインスタンスの操作）。
 */

test("artboard を選んでいるときは削除だけが並ぶ", () => {
  expect(
    operationsIn(
      EditMenu.create(stateSelecting("home"), EditMenuTargets.Artboard),
    ),
  ).toEqual([EditOperations.Delete]);
});

test("artboard を選んでいるときの削除は押せる", () => {
  const menu = EditMenu.create(
    stateSelecting("home"),
    EditMenuTargets.Artboard,
  );

  expect(isRowEnabled(menu, EditOperations.Delete)).toBe(true);
});

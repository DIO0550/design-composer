import { expect, test } from "vitest";
import { EditMenu, EditMenuTargets, EditOperations } from "../index";
import { isRowEnabled, operationsIn, stateSelecting } from "./setup";

/*
 * artboard を右クリックしたときに並ぶものを確かめる
 * （docs/06-ui.md「コンテキストメニュー」の表）。
 *
 * ノードの並びのうち artboard で意味を持つのは名前を変更と削除の 2 つ（コピーは貼る先がどの
 * ノードの子にもなれず、並べ替えは一覧の担当、解除はインスタンスの操作）。
 */

test("artboard を選んでいるときは名前を変更と削除が並ぶ", () => {
  expect(
    operationsIn(
      EditMenu.create(stateSelecting("home"), EditMenuTargets.Artboard),
    ),
  ).toEqual([EditOperations.Rename, EditOperations.Delete]);
});

test("artboard を選んでいるときの名前を変更は押せる", () => {
  const menu = EditMenu.create(
    stateSelecting("home"),
    EditMenuTargets.Artboard,
  );

  expect(isRowEnabled(menu, EditOperations.Rename)).toBe(true);
});

test("artboard を選んでいるときの削除は押せる", () => {
  const menu = EditMenu.create(
    stateSelecting("home"),
    EditMenuTargets.Artboard,
  );

  expect(isRowEnabled(menu, EditOperations.Delete)).toBe(true);
});

test("artboard の並びは名前を変更と削除の 2 つの組に分かれる", () => {
  expect(
    EditMenu.create(stateSelecting("home"), EditMenuTargets.Artboard).groups,
  ).toHaveLength(2);
});

import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { EditorState } from "../../editor-state";
import { EditMenu, EditMenuTargets, EditOperations } from "../index";
import {
  isRowEnabled,
  operationsIn,
  setupState,
  stateAfterEdit,
  stateSelecting,
} from "./setup";

/*
 * 空き領域を右クリックしたときに並ぶものと、押せるかどうかを確かめる
 * （docs/06-ui.md「コンテキストメニュー」の表）。
 *
 * 空き領域では選択に手を付けないので、**選択を持ったままこのメニューが出る**。
 */

test("空き領域ではペースト・取り消す・やり直すが並ぶ", () => {
  expect(
    operationsIn(EditMenu.create(setupState(), EditMenuTargets.EmptyArea)),
  ).toEqual([EditOperations.Paste, EditOperations.Undo, EditOperations.Redo]);
});

test("コピー済みでも選択が無いときはペーストが押せない", () => {
  const copied = Option.unwrap(EditorState.copyNode(stateSelecting("title")));
  const menu = EditMenu.create(
    EditorState.clearSelection(copied),
    EditMenuTargets.EmptyArea,
  );

  expect(isRowEnabled(menu, EditOperations.Paste)).toBe(false);
});

test("コピー済みで貼り先のあるノードを選んでいれば、空き領域からでもペーストが押せる", () => {
  const copied = Option.unwrap(EditorState.copyNode(stateSelecting("title")));
  const menu = EditMenu.create(
    EditorState.select(copied, "panel"),
    EditMenuTargets.EmptyArea,
  );

  expect(isRowEnabled(menu, EditOperations.Paste)).toBe(true);
});

test("編集をしていないときは取り消すが押せない", () => {
  const menu = EditMenu.create(setupState(), EditMenuTargets.EmptyArea);

  expect(isRowEnabled(menu, EditOperations.Undo)).toBe(false);
});

test("編集したあとは取り消すが押せる", () => {
  const menu = EditMenu.create(stateAfterEdit(), EditMenuTargets.EmptyArea);

  expect(isRowEnabled(menu, EditOperations.Undo)).toBe(true);
});

test("編集しただけでやり直すは押せない", () => {
  const menu = EditMenu.create(stateAfterEdit(), EditMenuTargets.EmptyArea);

  expect(isRowEnabled(menu, EditOperations.Redo)).toBe(false);
});

test("取り消したあとはやり直すが押せる", () => {
  const undone = Option.unwrap(EditorState.undo(stateAfterEdit()));
  const menu = EditMenu.create(undone, EditMenuTargets.EmptyArea);

  expect(isRowEnabled(menu, EditOperations.Redo)).toBe(true);
});

test("複数選択のまま空き領域を右クリックしても取り消すは押せる", () => {
  const edited = stateAfterEdit();
  const menu = EditMenu.create(
    EditorState.selectNodes(edited, ["panel", "login"]),
    EditMenuTargets.EmptyArea,
  );

  expect(isRowEnabled(menu, EditOperations.Undo)).toBe(true);
});

test("複数選択のまま空き領域を右クリックするとペーストは押せない", () => {
  const copied = Option.unwrap(EditorState.copyNode(stateSelecting("title")));
  const menu = EditMenu.create(
    EditorState.selectNodes(copied, ["panel", "login"]),
    EditMenuTargets.EmptyArea,
  );

  expect(isRowEnabled(menu, EditOperations.Paste)).toBe(false);
});

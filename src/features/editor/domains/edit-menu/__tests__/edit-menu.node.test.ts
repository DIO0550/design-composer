import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { EditorState } from "../../editor-state";
import {
  EditMenu,
  EditMenuTargets,
  type EditOperation,
  EditOperations,
} from "../index";
import {
  isRowEnabled,
  operationsIn,
  setupState,
  stateSelecting,
} from "./setup";

/*
 * ノードを右クリックしたときに並ぶものと、押せるかどうかを確かめる
 * （docs/06-ui.md「コンテキストメニュー」）。
 */

/**
 * ノードのメニューに並ぶ操作。
 *
 * @param state 押せるかどうかの出どころ
 * @returns 並ぶ順の操作
 */
function nodeOperations(state: EditorState): readonly EditOperation[] {
  return operationsIn(EditMenu.create(state, EditMenuTargets.Node));
}

test("ノードを選んでいるときはコピー・ペースト・前面へ・背面へ・インスタンスを解除・削除が並ぶ", () => {
  expect(nodeOperations(stateSelecting("panel"))).toEqual([
    EditOperations.Copy,
    EditOperations.Paste,
    EditOperations.BringForward,
    EditOperations.SendBackward,
    EditOperations.DetachInstance,
    EditOperations.Delete,
  ]);
});

test("並びは 4 つの組に分かれる", () => {
  expect(
    EditMenu.create(stateSelecting("panel"), EditMenuTargets.Node).groups,
  ).toHaveLength(4);
});

test("いちばん背面にあるノードでは背面へが押せない", () => {
  const menu = EditMenu.create(stateSelecting("title"), EditMenuTargets.Node);

  expect(isRowEnabled(menu, EditOperations.SendBackward)).toBe(false);
});

test("いちばん背面にあるノードでも前面へは押せる", () => {
  const menu = EditMenu.create(stateSelecting("title"), EditMenuTargets.Node);

  expect(isRowEnabled(menu, EditOperations.BringForward)).toBe(true);
});

test("いちばん前面にあるノードでは前面へが押せない", () => {
  const menu = EditMenu.create(stateSelecting("login"), EditMenuTargets.Node);

  expect(isRowEnabled(menu, EditOperations.BringForward)).toBe(false);
});

test("いちばん前面にあるノードでも背面へは押せる", () => {
  const menu = EditMenu.create(stateSelecting("login"), EditMenuTargets.Node);

  expect(isRowEnabled(menu, EditOperations.SendBackward)).toBe(true);
});

test("インスタンスを選んでいるときはインスタンスを解除が押せる", () => {
  const menu = EditMenu.create(stateSelecting("login"), EditMenuTargets.Node);

  expect(isRowEnabled(menu, EditOperations.DetachInstance)).toBe(true);
});

test("インスタンス以外を選んでいるときはインスタンスを解除が押せない", () => {
  const menu = EditMenu.create(stateSelecting("panel"), EditMenuTargets.Node);

  expect(isRowEnabled(menu, EditOperations.DetachInstance)).toBe(false);
});

test("コピーしていないときは、貼り先のあるノードを選んでいてもペーストが押せない", () => {
  const menu = EditMenu.create(stateSelecting("panel"), EditMenuTargets.Node);

  expect(isRowEnabled(menu, EditOperations.Paste)).toBe(false);
});

test("コピーしたあとは、貼り先のあるノードを選んでいるとペーストが押せる", () => {
  const copied = Option.unwrap(EditorState.copyNode(stateSelecting("title")));
  const menu = EditMenu.create(
    EditorState.select(copied, "panel"),
    EditMenuTargets.Node,
  );

  expect(isRowEnabled(menu, EditOperations.Paste)).toBe(true);
});

test("1 つだけ選んでいるときは削除が押せる", () => {
  const menu = EditMenu.create(stateSelecting("panel"), EditMenuTargets.Node);

  expect(isRowEnabled(menu, EditOperations.Delete)).toBe(true);
});

test("複数選択中はどの行も押せない", () => {
  const menu = EditMenu.create(
    EditorState.selectNodes(setupState(), ["title", "panel"]),
    EditMenuTargets.Node,
  );

  expect(menu.groups.flat().map((row) => row.isEnabled)).toEqual([
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
});

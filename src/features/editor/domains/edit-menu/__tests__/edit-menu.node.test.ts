import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
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

/**
 * メニューの中で押せる操作。
 *
 * @param menu 見ているメニュー
 * @returns 押せる操作を並ぶ順に
 */
function enabledOperations(menu: EditMenu): readonly EditOperation[] {
  return menu.sections
    .flat()
    .filter((row) => row.isEnabled)
    .map((row) => row.operation);
}

/**
 * `home` に `title` と `panel` が並び、`panel` の中に `inner-a` と `inner-b` がいる状態。
 *
 * @returns その並びを持つエディタの状態
 */
function stateWithNestedPanel(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            { name: "title", type: "Text" },
            {
              name: "panel",
              type: "Box",
              children: [
                { name: "inner-a", type: "Box" },
                { name: "inner-b", type: "Box" },
              ],
            },
          ],
        },
      ],
    }),
  );
}

test("ノードを選んでいるときは複製・コピー・ペースト・名前を変更・グループ化・グループ解除・前面へ・背面へ・インスタンスを解除・削除が並ぶ", () => {
  expect(nodeOperations(stateSelecting("panel"))).toEqual([
    EditOperations.Duplicate,
    EditOperations.Copy,
    EditOperations.Paste,
    EditOperations.Rename,
    EditOperations.Group,
    EditOperations.Ungroup,
    EditOperations.BringForward,
    EditOperations.SendBackward,
    EditOperations.DetachInstance,
    EditOperations.Delete,
  ]);
});

test("並びは 5 つの組に分かれる", () => {
  expect(
    EditMenu.create(stateSelecting("panel"), EditMenuTargets.Node).sections,
  ).toHaveLength(5);
});

test("名前を変更・グループ化・グループ解除は同じ組に並ぶ", () => {
  const menu = EditMenu.create(stateSelecting("panel"), EditMenuTargets.Node);

  expect(
    menu.sections.map((section) => section.map((row) => row.operation)),
  ).toContainEqual([
    EditOperations.Rename,
    EditOperations.Group,
    EditOperations.Ungroup,
  ]);
});

test("1 つだけ選んでいるときは名前を変更が押せる", () => {
  const menu = EditMenu.create(stateSelecting("panel"), EditMenuTargets.Node);

  expect(isRowEnabled(menu, EditOperations.Rename)).toBe(true);
});

test("何も選んでいないときは名前を変更が押せない", () => {
  const menu = EditMenu.create(setupState(), EditMenuTargets.Node);

  expect(isRowEnabled(menu, EditOperations.Rename)).toBe(false);
});

test("Box を選んでいるときはグループ化が押せる", () => {
  const menu = EditMenu.create(stateSelecting("panel"), EditMenuTargets.Node);

  expect(isRowEnabled(menu, EditOperations.Group)).toBe(true);
});

test("複製・コピー・ペーストは同じ組に並ぶ", () => {
  const menu = EditMenu.create(stateSelecting("panel"), EditMenuTargets.Node);

  expect(
    menu.sections.map((section) => section.map((row) => row.operation)),
  ).toContainEqual([
    EditOperations.Duplicate,
    EditOperations.Copy,
    EditOperations.Paste,
  ]);
});

test("Text を選んでいても複製は押せる", () => {
  const menu = EditMenu.create(stateSelecting("title"), EditMenuTargets.Node);

  expect(isRowEnabled(menu, EditOperations.Duplicate)).toBe(true);
});

test("何も選んでいないときは複製が押せない", () => {
  const menu = EditMenu.create(setupState(), EditMenuTargets.Node);

  expect(isRowEnabled(menu, EditOperations.Duplicate)).toBe(false);
});

test("Text を選んでいてもグループ化は押せる", () => {
  const menu = EditMenu.create(stateSelecting("title"), EditMenuTargets.Node);

  expect(isRowEnabled(menu, EditOperations.Group)).toBe(true);
});

test("何も選んでいないときはグループ化が押せない", () => {
  const menu = EditMenu.create(setupState(), EditMenuTargets.Node);

  expect(isRowEnabled(menu, EditOperations.Group)).toBe(false);
});

test("Box を選んでいるときはグループ解除が押せる", () => {
  const menu = EditMenu.create(stateSelecting("panel"), EditMenuTargets.Node);

  expect(isRowEnabled(menu, EditOperations.Ungroup)).toBe(true);
});

test("Text を選んでいるときはグループ解除が押せない", () => {
  const menu = EditMenu.create(stateSelecting("title"), EditMenuTargets.Node);

  expect(isRowEnabled(menu, EditOperations.Ungroup)).toBe(false);
});

test("何も選んでいないときはグループ解除が押せない", () => {
  const menu = EditMenu.create(setupState(), EditMenuTargets.Node);

  expect(isRowEnabled(menu, EditOperations.Ungroup)).toBe(false);
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

test("同じ親の兄弟を複数選んでいるときは、動かせる向きの並べ替えと削除が押せる", () => {
  const menu = EditMenu.create(
    EditorState.selectNodes(setupState(), ["title", "panel"]),
    EditMenuTargets.Node,
  );

  expect(enabledOperations(menu)).toEqual([
    EditOperations.BringForward,
    EditOperations.Delete,
  ]);
});

test("最前面にいるものを含む兄弟を複数選んでいるときは、前面へが押せない", () => {
  const menu = EditMenu.create(
    EditorState.selectNodes(setupState(), ["panel", "login"]),
    EditMenuTargets.Node,
  );

  expect([
    isRowEnabled(menu, EditOperations.BringForward),
    isRowEnabled(menu, EditOperations.SendBackward),
  ]).toEqual([false, true]);
});

test("親が違うノードを複数選んでいるときは、削除だけが押せる", () => {
  const menu = EditMenu.create(
    EditorState.selectNodes(stateWithNestedPanel(), ["title", "inner-a"]),
    EditMenuTargets.Node,
  );

  expect(enabledOperations(menu)).toEqual([EditOperations.Delete]);
});

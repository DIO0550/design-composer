import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";
import { stateWithDeepBranch } from "./setup";

/*
 * グループ化・グループ解除が成立しない相手（docs/06-ui.md「編集操作の一覧」）。
 * 複数選択中に成立しないことは `editor-state.multi-selection.test.ts`、ファイルが不正な間に
 * 成立しないことは `editor-state.frozen.test.ts` が、どちらも対照つきで持つ。
 */

test("何も選んでいないときはグループ化できない", () => {
  expect(EditorState.groupSelected(stateWithDeepBranch())).toStrictEqual(
    Option.none,
  );
});

test("artboard を選んでいるときはグループ化できない", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "home");

  expect(EditorState.groupSelected(selected)).toStrictEqual(Option.none);
});

test("何も選んでいないときは解除できない", () => {
  expect(EditorState.ungroupSelected(stateWithDeepBranch())).toStrictEqual(
    Option.none,
  );
});

test("artboard を選んでいるときは解除できない", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "home");

  expect(EditorState.ungroupSelected(selected)).toStrictEqual(Option.none);
});

test("Text を選んでいるときは解除できない", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "deep-title");

  expect(EditorState.ungroupSelected(selected)).toStrictEqual(Option.none);
});

test("部品インスタンスを選んでいるときは解除できない", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "home-login");

  expect(EditorState.ungroupSelected(selected)).toStrictEqual(Option.none);
});

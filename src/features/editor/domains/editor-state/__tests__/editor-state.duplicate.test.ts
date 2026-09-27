import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";
import { childNames, nodeNamed, stateWithDeepBranch } from "./setup";

/*
 * 選んでいるノードを複製する（docs/06-ui.md「編集操作の一覧」の複製）。直後へ入ることと
 * 名前の付け替えは `design-document.copy-after.test.ts` が持つ。ここで見るのは、対象が選択
 * からどう決まり、履歴・選択・クリップボードがどうなるか。
 *
 * 複製元の `sibling-panel` は後ろに `home-login` を持つので、末尾へ入れる実装と区別できる。
 */

test("選んでいるノードを複製すると、その直後に並ぶ", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "sibling-panel");

  const duplicated = Option.unwrap(EditorState.duplicateSelected(selected));

  expect(childNames(duplicated, "home")).toEqual([
    "outer-panel",
    "sibling-panel",
    "sibling-panel-2",
    "home-login",
  ]);
});

test("複製すると、選択が複製へ移る", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "sibling-panel");

  const duplicated = Option.unwrap(EditorState.duplicateSelected(selected));

  expect(EditorState.singleName(duplicated)).toEqual(
    Option.some("sibling-panel-2"),
  );
});

test("続けて複製すると、複製の複製がその直後に並ぶ", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "sibling-panel");
  const once = Option.unwrap(EditorState.duplicateSelected(selected));

  const twice = Option.unwrap(EditorState.duplicateSelected(once));

  expect(childNames(twice, "home")).toEqual([
    "outer-panel",
    "sibling-panel",
    "sibling-panel-2",
    "sibling-panel-2-2",
    "home-login",
  ]);
});

test("複製してもクリップボードの中身は変わらない", () => {
  const copied = Option.unwrap(
    EditorState.copyNode(
      EditorState.select(stateWithDeepBranch(), "home-login"),
    ),
  );

  const duplicated = Option.unwrap(
    EditorState.duplicateSelected(EditorState.select(copied, "sibling-panel")),
  );

  expect(duplicated.copiedNode).toEqual(
    Option.some(nodeNamed(copied, "home-login")),
  );
});

test("複製を取り消すと元の並びに戻る", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "sibling-panel");
  const duplicated = Option.unwrap(EditorState.duplicateSelected(selected));

  const undone = Option.unwrap(EditorState.undo(duplicated));

  expect(childNames(undone, "home")).toEqual([
    "outer-panel",
    "sibling-panel",
    "home-login",
  ]);
});

test("artboard を選んでいるときは複製できない", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "home");

  expect(EditorState.duplicateSelected(selected)).toEqual(Option.none);
});

test("何も選んでいないときは複製できない", () => {
  expect(EditorState.duplicateSelected(stateWithDeepBranch())).toEqual(
    Option.none,
  );
});

test("複数選んでいるときは複製できない", () => {
  const selected = EditorState.selectNodes(stateWithDeepBranch(), [
    "outer-panel",
    "sibling-panel",
  ]);

  expect(EditorState.duplicateSelected(selected)).toEqual(Option.none);
});

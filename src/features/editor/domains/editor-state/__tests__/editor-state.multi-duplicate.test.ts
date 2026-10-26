import { expect, test } from "vitest";
import { DocumentSelection } from "@/domains/session/document-selection";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";
import {
  childNames,
  nodeNamed,
  stateWithChildInEachArtboard,
  stateWithDeepBranch,
} from "./setup";

/*
 * 複数選んでいるときの複製（docs/06-ui.md「複数選択」）。直後へ入ることと名前の付け替えは
 * `design-document.copies-after.test.ts` が持つ。ここで見るのは、対象が選択からどう決まり、
 * 履歴・選択・クリップボードがどうなるか。
 *
 * 選ぶ順はツリーの並びと逆にする。ツリーの順に並べ直す実装と区別するため。
 */

/** `sibling-panel` と `outer-panel` をこの順にまとめて選んで複製した状態。 */
function duplicateSiblings(): EditorState {
  return Option.unwrap(
    EditorState.duplicateSelected(
      EditorState.selectNodes(stateWithDeepBranch(), [
        "sibling-panel",
        "outer-panel",
      ]),
    ),
  );
}

test("兄弟をまとめて複製すると、それぞれの直後に並ぶ", () => {
  expect(childNames(duplicateSiblings(), "home")).toEqual([
    "outer-panel",
    "outer-panel-2",
    "sibling-panel",
    "sibling-panel-2",
    "home-login",
  ]);
});

test("別の artboard のノードをまとめて複製すると、それぞれの親の中の直後に並ぶ", () => {
  const duplicated = Option.unwrap(
    EditorState.duplicateSelected(
      EditorState.selectNodes(stateWithChildInEachArtboard(), [
        "about-title",
        "home-title",
      ]),
    ),
  );

  expect([
    childNames(duplicated, "home"),
    childNames(duplicated, "about"),
  ]).toEqual([
    ["home-title", "home-title-2"],
    ["about-title", "about-title-2"],
  ]);
});

test("まとめて複製すると、複製がまとめて選ばれる", () => {
  expect(
    DocumentSelection.names(EditorState.documentSelection(duplicateSiblings())),
  ).toEqual(["sibling-panel-2", "outer-panel-2"]);
});

test("親と子をまとめて選んで複製すると、親だけが複製される", () => {
  const duplicated = Option.unwrap(
    EditorState.duplicateSelected(
      EditorState.selectNodes(stateWithDeepBranch(), [
        "inner-panel",
        "outer-panel",
      ]),
    ),
  );

  expect(
    DocumentSelection.names(EditorState.documentSelection(duplicated)),
  ).toEqual(["outer-panel-2"]);
});

test("まとめて複製したものは 1 回の取り消しで全部戻る", () => {
  const undone = Option.unwrap(EditorState.undo(duplicateSiblings()));

  expect(childNames(undone, "home")).toEqual([
    "outer-panel",
    "sibling-panel",
    "home-login",
  ]);
});

test("まとめて複製してもクリップボードの中身は変わらない", () => {
  const copied = Option.unwrap(
    EditorState.copySelected(
      EditorState.select(stateWithDeepBranch(), "home-login"),
    ),
  );

  const duplicated = Option.unwrap(
    EditorState.duplicateSelected(
      EditorState.selectNodes(copied, ["sibling-panel", "outer-panel"]),
    ),
  );

  expect(duplicated.copiedNodes).toEqual(
    Option.some([nodeNamed(copied, "home-login")]),
  );
});

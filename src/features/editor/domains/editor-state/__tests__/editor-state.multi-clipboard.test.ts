import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";
import { childNames, stateWithDeepBranch } from "./setup";

/*
 * 複数選んでいるときのコピーと、1 つだけ選んでいるときのペースト（docs/06-ui.md「複数選択」）。
 * 名前の付け替えは `design-document.node-copies.test.ts` が持つ。
 *
 * 選ぶ順はツリーの並びと逆にする。ツリーの順に並べ直す実装と区別するため。
 */

/**
 * 名前で指したノードをまとめて選んでコピーした状態。
 *
 * @param names 選ぶノードの名前
 * @returns コピーしたあとの状態。コピーできなければテストを落とす
 */
function copyNodes(names: readonly string[]): EditorState {
  return Option.unwrap(
    EditorState.copySelected(
      EditorState.selectNodes(stateWithDeepBranch(), names),
    ),
  );
}

/**
 * `home-login` と `outer-panel` をこの順にまとめてコピーし、`sibling-panel` を 1 つだけ
 * 選んで貼った状態。
 */
function pasteIntoSiblingPanel(): EditorState {
  const copied = copyNodes(["home-login", "outer-panel"]);
  return Option.unwrap(
    EditorState.pasteCopied(EditorState.select(copied, "sibling-panel")),
  );
}

test("複数選んでコピーすると、選んだ順にクリップボードへ入る", () => {
  const copied = copyNodes(["sibling-panel", "outer-panel"]);

  expect(
    Option.map(copied.copiedNodes, (nodes) => nodes.map((node) => node.name)),
  ).toEqual(Option.some(["sibling-panel", "outer-panel"]));
});

test("親と子を選んでコピーすると、親のサブツリーだけが入る", () => {
  const copied = copyNodes(["inner-panel", "outer-panel"]);

  expect(
    Option.map(copied.copiedNodes, (nodes) => nodes.map((node) => node.name)),
  ).toEqual(Option.some(["outer-panel"]));
});

test("1 つだけ選んで貼ると、写した順に末尾へ全部並ぶ", () => {
  expect(childNames(pasteIntoSiblingPanel(), "sibling-panel")).toEqual([
    "home-login-2",
    "outer-panel-2",
  ]);
});

test("まとめて貼ったあともドキュメントは名前の一意性を満たす", () => {
  expect(
    DesignDocument.collectErrors(EditorState.document(pasteIntoSiblingPanel())),
  ).toEqual([]);
});

test("まとめて貼ったものは 1 回の取り消しで全部戻る", () => {
  const undone = Option.unwrap(EditorState.undo(pasteIntoSiblingPanel()));

  expect(childNames(undone, "sibling-panel")).toEqual([]);
});

test("まとめて貼っても選択は動かない", () => {
  expect(EditorState.singleName(pasteIntoSiblingPanel())).toEqual(
    Option.some("sibling-panel"),
  );
});

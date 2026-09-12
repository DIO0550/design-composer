import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";
import { frozen } from "./frozen-state";
import { childNames, stateWithNestedBox } from "./setup";

/*
 * 選んでいるものの名前を GUI から変える操作（docs/06-ui.md「名前の変更」）。
 */

/**
 * `title` を選んで名前の編集を始めた状態。
 *
 * @returns 名前を編集中のエディタの状態
 */
function renamingTitle(): EditorState {
  return Option.unwrap(
    EditorState.startRenamingAt(stateWithNestedBox(), "title"),
  );
}

test("1 つだけ選んでいるときは名前の編集を始められる", () => {
  const selected = EditorState.select(stateWithNestedBox(), "title");

  const started = EditorState.startRenaming(selected);

  expect(Option.map(started, EditorState.renamingName)).toEqual(
    Option.some(Option.some("title")),
  );
});

test("何も選んでいないときは名前の編集を始められない", () => {
  expect(EditorState.startRenaming(stateWithNestedBox()).some).toBe(false);
});

test("複数選んでいるときは名前の編集を始められない", () => {
  const multiple = EditorState.selectNodes(stateWithNestedBox(), [
    "title",
    "body",
  ]);

  expect(EditorState.startRenaming(multiple).some).toBe(false);
});

test("ファイルが不正な間は名前の編集を始められない", () => {
  const selected = EditorState.select(stateWithNestedBox(), "title");

  expect(EditorState.startRenaming(frozen(selected)).some).toBe(false);
});

test("行から編集を始めると、その行のものが選択になる", () => {
  const started = Option.unwrap(
    EditorState.startRenamingAt(stateWithNestedBox(), "body-text"),
  );

  expect(EditorState.renamingName(started)).toEqual(Option.some("body-text"));
});

test("ドキュメントに無い名前では編集を始められない", () => {
  expect(
    EditorState.startRenamingAt(stateWithNestedBox(), "missing").some,
  ).toBe(false);
});

test("名前を変えると、その名前で並びに現れる", () => {
  const renamed = Option.unwrap(
    EditorState.renameSelected(renamingTitle(), "caption"),
  );

  expect(childNames(renamed, "home")).toEqual(["caption", "body"]);
});

test("名前を変えると選択が新しい名前へ移る", () => {
  const renamed = Option.unwrap(
    EditorState.renameSelected(renamingTitle(), "caption"),
  );

  expect(EditorState.singleName(renamed)).toEqual(Option.some("caption"));
});

test("名前を変えると編集は閉じる", () => {
  const renamed = Option.unwrap(
    EditorState.renameSelected(renamingTitle(), "caption"),
  );

  expect(EditorState.renamingName(renamed).some).toBe(false);
});

test("既に使われている名前では変わらない", () => {
  expect(EditorState.renameSelected(renamingTitle(), "body").some).toBe(false);
});

test("識別子の規則を満たさない名前では変わらない", () => {
  expect(EditorState.renameSelected(renamingTitle(), "Caption").some).toBe(
    false,
  );
});

test("名前を編集していないときは名前を変えられない", () => {
  const selected = EditorState.select(stateWithNestedBox(), "title");

  expect(EditorState.renameSelected(selected, "caption").some).toBe(false);
});

test("ファイルが不正な間は名前を変えられない", () => {
  expect(
    EditorState.renameSelected(frozen(renamingTitle()), "caption").some,
  ).toBe(false);
});

test("名前を変えたあと取り消すと元の名前へ戻る", () => {
  const renamed = Option.unwrap(
    EditorState.renameSelected(renamingTitle(), "caption"),
  );

  const undone = Option.unwrap(EditorState.undo(renamed));

  expect(childNames(undone, "home")).toEqual(["title", "body"]);
});

test("編集をやめると名前は変わらない", () => {
  const canceled = EditorState.cancelRenaming(renamingTitle());

  expect(EditorState.renamingName(canceled).some).toBe(false);
  expect(childNames(canceled, "home")).toEqual(["title", "body"]);
});

test("編集中に対象が消えると編集も閉じる", () => {
  const removed = Option.unwrap(EditorState.removeSelected(renamingTitle()));

  expect(EditorState.renamingName(removed).some).toBe(false);
});

test("フォーカスを外して終えるときも、使える名前なら確定する", () => {
  const finished = EditorState.finishRenaming(renamingTitle(), "caption");

  expect(childNames(finished, "home")).toEqual(["caption", "body"]);
});

test("フォーカスを外して終えると編集は閉じる", () => {
  const finished = EditorState.finishRenaming(renamingTitle(), "caption");

  expect(EditorState.renamingName(finished).some).toBe(false);
});

test("使えない名前でフォーカスを外すと、名前は変わらないまま編集が閉じる", () => {
  const finished = EditorState.finishRenaming(renamingTitle(), "body");

  expect(childNames(finished, "home")).toEqual(["title", "body"]);
  expect(EditorState.renamingName(finished).some).toBe(false);
});

test("打ち替えずにフォーカスを外しても、名前は変わらず編集が閉じる", () => {
  const finished = EditorState.finishRenaming(renamingTitle(), "title");

  expect(childNames(finished, "home")).toEqual(["title", "body"]);
  expect(EditorState.renamingName(finished).some).toBe(false);
});

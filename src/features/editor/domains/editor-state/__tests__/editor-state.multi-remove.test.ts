import { expect, test } from "vitest";
import { documentWithChildInEachArtboard } from "@/domains/__tests__/sample-document";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";
import { stateWithNestedBox } from "./setup";

function stateWithChildInEachArtboard(): EditorState {
  return EditorState.create(documentWithChildInEachArtboard());
}

function hasNode(state: EditorState, name: string): boolean {
  return Option.isSome(
    DesignDocument.findNode(EditorState.document(state), name),
  );
}

test("複数のノードを選んで削除すると、選んだものがすべてツリーから消える", () => {
  const state = EditorState.selectNodes(stateWithNestedBox(), [
    "title",
    "body",
  ]);

  const removed = Option.unwrap(EditorState.removeSelected(state));

  expect([hasNode(removed, "title"), hasNode(removed, "body")]).toEqual([
    false,
    false,
  ]);
});

test("親と子を親から順に選んで削除すると、親のサブツリーごと消える", () => {
  const state = EditorState.selectNodes(stateWithNestedBox(), [
    "body",
    "body-text",
  ]);

  const removed = Option.unwrap(EditorState.removeSelected(state));

  expect([hasNode(removed, "body"), hasNode(removed, "body-text")]).toEqual([
    false,
    false,
  ]);
});

test("親と子を子から順に選んで削除すると、親のサブツリーごと消える", () => {
  const state = EditorState.selectNodes(stateWithNestedBox(), [
    "body-text",
    "body",
  ]);

  const removed = Option.unwrap(EditorState.removeSelected(state));

  expect([hasNode(removed, "body"), hasNode(removed, "body-text")]).toEqual([
    false,
    false,
  ]);
});

test("artboard をまたいで選んだノードをまとめて削除できる", () => {
  const state = EditorState.selectNodes(stateWithChildInEachArtboard(), [
    "home-title",
    "about-title",
  ]);

  const removed = Option.unwrap(EditorState.removeSelected(state));

  expect([
    hasNode(removed, "home-title"),
    hasNode(removed, "about-title"),
  ]).toEqual([false, false]);
});

test("複数選んで削除したあと、1 回の取り消しで全部戻る", () => {
  const state = EditorState.selectNodes(stateWithNestedBox(), [
    "title",
    "body",
  ]);
  const removed = Option.unwrap(EditorState.removeSelected(state));

  const undone = Option.unwrap(EditorState.undo(removed));

  expect(EditorState.document(undone)).toEqual(EditorState.document(state));
});

test("複数選んで削除すると選択が外れる", () => {
  const state = EditorState.selectNodes(stateWithNestedBox(), [
    "title",
    "body",
  ]);

  const removed = Option.unwrap(EditorState.removeSelected(state));

  expect(EditorState.documentSelection(removed).selected).toEqual({
    kind: "none",
  });
});

test("子だけを選んで削除すると、選んでいない親は残る", () => {
  const state = EditorState.selectNodes(stateWithNestedBox(), [
    "title",
    "body-text",
  ]);

  const removed = Option.unwrap(EditorState.removeSelected(state));

  expect(hasNode(removed, "body")).toBe(true);
});

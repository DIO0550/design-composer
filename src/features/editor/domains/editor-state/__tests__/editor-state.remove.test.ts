import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";
import { stateWithNestedBox } from "./setup";

test("選択中のノードを削除するとツリーから消える", () => {
  const state = EditorState.select(stateWithNestedBox(), "title");

  const removed = Option.unwrap(EditorState.removeNode(state));

  expect(
    DesignDocument.findNode(EditorState.document(removed), "title"),
  ).toEqual(Option.none);
});

test("削除は選択したノードのサブツリーごと消す", () => {
  const state = EditorState.select(stateWithNestedBox(), "body");

  const removed = Option.unwrap(EditorState.removeNode(state));

  expect(
    DesignDocument.findNode(EditorState.document(removed), "body-text"),
  ).toEqual(Option.none);
});

test("削除すると選択が外れる", () => {
  const state = EditorState.select(stateWithNestedBox(), "title");

  const removed = Option.unwrap(EditorState.removeNode(state));

  expect(EditorState.singleName(removed)).toEqual(Option.none);
});

test("削除しても兄弟は残る", () => {
  const state = EditorState.select(stateWithNestedBox(), "title");

  const removed = Option.unwrap(EditorState.removeNode(state));

  expect(
    DesignDocument.findNode(EditorState.document(removed), "body").some,
  ).toBe(true);
});

test("削除した名前は使われていない名前に戻る", () => {
  const state = EditorState.select(stateWithNestedBox(), "title");

  const removed = Option.unwrap(EditorState.removeNode(state));

  expect(
    DesignDocument.usedNames(EditorState.document(removed)).has("title"),
  ).toBe(false);
});

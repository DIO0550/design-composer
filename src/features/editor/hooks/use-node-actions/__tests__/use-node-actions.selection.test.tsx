import { act } from "@testing-library/react";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { SelectionDigs } from "@/domains/session/selection-dig";
import { UnderPointer } from "@/domains/session/under-pointer";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { setup } from "./setup";

/*
 * ツリー・キャンバス・エラー行から届く選択の操作が、それぞれの選び方で選択を変えることを
 * 確かめる（docs/06-ui.md「選択」）。
 */

test("select は、複数選んでいても指した 1 つだけを選ぶ", () => {
  const { current } = setup(["title", "footer"]);

  act(() => current().hook.select("title"));

  expect(
    DocumentSelection.names(
      EditorState.documentSelection(current().editor.state),
    ),
  ).toEqual(["title"]);
});

test("select でドキュメントに無い名前を指すと、何も選んでいない状態になる", () => {
  const { current } = setup(["title"]);

  act(() => current().hook.select("missing"));

  expect(
    DocumentSelection.names(
      EditorState.documentSelection(current().editor.state),
    ),
  ).toEqual([]);
});

test("selectIfUnselected は、指したものが既に選択に入っていれば選択を変えない", () => {
  const { current } = setup(["title", "footer"]);

  act(() => current().hook.selectIfUnselected("title"));

  expect(
    DocumentSelection.names(
      EditorState.documentSelection(current().editor.state),
    ),
  ).toEqual(["title", "footer"]);
});

test("selectIfUnselected は、指したものが選択に入っていなければそれだけを選ぶ", () => {
  const { current } = setup(["title", "footer"]);

  act(() => current().hook.selectIfUnselected("panel"));

  expect(
    DocumentSelection.names(
      EditorState.documentSelection(current().editor.state),
    ),
  ).toEqual(["panel"]);
});

test("reveal は、エラーが指すノードを選び、名前の編集には入らない", () => {
  const { current } = setup(["title"]);

  act(() => current().hook.reveal("panel"));

  const { state } = current().editor;
  expect({
    selected: DocumentSelection.names(EditorState.documentSelection(state)),
    renamingName: EditorState.renamingName(state),
  }).toEqual({ selected: ["panel"], renamingName: Option.none });
});

test("reveal でドキュメントに無い名前を指すと、選択は変わらない", () => {
  const { current } = setup(["title"]);

  act(() => current().hook.reveal("missing"));

  expect(
    DocumentSelection.names(
      EditorState.documentSelection(current().editor.state),
    ),
  ).toEqual(["title"]);
});

test("selectAt は、ポインタの下にあるもののうち、掘る量で決まる深さのものを選ぶ", () => {
  const { current } = setup(["title"]);

  act(() =>
    current().hook.selectAt(
      UnderPointer.create(
        ["panel-label", "panel", "home"],
        SelectionDigs.NoDeeper,
      ),
    ),
  );

  expect(
    DocumentSelection.names(
      EditorState.documentSelection(current().editor.state),
    ),
  ).toEqual(["panel"]);
});

test("selectInRange は、範囲に重なったものをまとめて選ぶ", () => {
  const { current } = setup(["title"]);

  act(() => current().hook.selectInRange(["panel", "footer"]));

  expect(
    DocumentSelection.names(
      EditorState.documentSelection(current().editor.state),
    ),
  ).toEqual(["panel", "footer"]);
});

test("clearSelection は、ドキュメントを変えずに選択だけを外す", () => {
  const { current } = setup(["title"]);

  act(() => current().hook.clearSelection());

  const { state } = current().editor;
  expect({
    selected: DocumentSelection.names(EditorState.documentSelection(state)),
    title: DesignDocument.findChildPosition(
      EditorState.document(state),
      "title",
    ),
  }).toEqual({
    selected: [],
    title: Option.some({ parentName: "home", index: 0 }),
  });
});

test("selectAllInstances は、選んでいるインスタンスと同じ部品を指すインスタンスをまとめて選ぶ", () => {
  const { current } = setup(["home-card"]);

  act(() => current().hook.selectAllInstances());

  expect(
    DocumentSelection.names(
      EditorState.documentSelection(current().editor.state),
    ),
  ).toEqual(["home-card", "other-card"]);
});

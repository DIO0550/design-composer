import { act } from "@testing-library/react";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { setup } from "./setup";

/*
 * 行のダブルクリックと名前の入力欄から届く名前の編集が、確定・取り消しのそれぞれへ届くことを
 * 確かめる（docs/06-ui.md「名前の変更」）。
 */

test("startRenamingAt は、指したものを選んでその名前の編集に入る", () => {
  const { current } = setup(["title"]);

  act(() => current().hook.startRenamingAt("panel"));

  expect(EditorState.renamingName(current().editor.state)).toEqual(
    Option.some("panel"),
  );
});

test("rename は、編集中のものの名前を打った名前にする", () => {
  const { current } = setup(["title"]);
  act(() => current().editor.dispatch({ type: "start_renaming" }));

  act(() => current().hook.rename("heading"));

  expect(
    DesignDocument.findChildPosition(
      EditorState.document(current().editor.state),
      "heading",
    ),
  ).toEqual(Option.some({ parentName: "home", index: 0 }));
});

test("rename で使えない名前を打つと、編集は閉じない", () => {
  const { current } = setup(["title"]);
  act(() => current().editor.dispatch({ type: "start_renaming" }));

  act(() => current().hook.rename("panel"));

  expect(EditorState.renamingName(current().editor.state)).toEqual(
    Option.some("title"),
  );
});

test("finishRenaming は、使える名前なら編集中のものの名前をその名前にする", () => {
  const { current } = setup(["title"]);
  act(() => current().editor.dispatch({ type: "start_renaming" }));

  act(() => current().hook.finishRenaming("heading"));

  expect(
    DesignDocument.findChildPosition(
      EditorState.document(current().editor.state),
      "heading",
    ),
  ).toEqual(Option.some({ parentName: "home", index: 0 }));
});

test("finishRenaming で使えない名前を渡すと、取り消して編集を閉じる", () => {
  const { current } = setup(["title"]);
  act(() => current().editor.dispatch({ type: "start_renaming" }));

  act(() => current().hook.finishRenaming("panel"));

  expect(EditorState.renamingName(current().editor.state)).toEqual(Option.none);
});

test("cancelRenaming は、選択を残したまま名前の編集を閉じる", () => {
  const { current } = setup(["title"]);
  act(() => current().editor.dispatch({ type: "start_renaming" }));

  act(() => current().hook.cancelRenaming());

  const { state } = current().editor;
  expect({
    renamingName: EditorState.renamingName(state),
    selected: DocumentSelection.names(EditorState.documentSelection(state)),
  }).toEqual({ renamingName: Option.none, selected: ["title"] });
});

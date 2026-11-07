import { act } from "@testing-library/react";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { setup } from "./setup";

/* undo / redo が編集履歴を辿ることを確かめる（docs/06-ui.md「編集操作の一覧」）。 */

test("undo は、直前の編集を取り消す", () => {
  const { current } = setup(["title"]);
  act(() => current().editor.dispatch({ type: "remove_selected" }));

  act(() => current().hook.undo());

  expect(
    DesignDocument.findChildPosition(
      EditorState.document(current().editor.state),
      "title",
    ),
  ).toEqual(Option.some({ parentName: "home", index: 0 }));
});

test("redo は、取り消した編集をやり直す", () => {
  const { current } = setup(["title"]);
  act(() => current().editor.dispatch({ type: "remove_selected" }));
  act(() => current().editor.dispatch({ type: "undo" }));

  act(() => current().hook.redo());

  expect(
    DesignDocument.findNode(
      EditorState.document(current().editor.state),
      "title",
    ),
  ).toEqual(Option.none);
});

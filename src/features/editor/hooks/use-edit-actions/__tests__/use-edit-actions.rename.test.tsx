import { act } from "@testing-library/react";
import { expect, test } from "vitest";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { setup } from "./setup";

test("startRenaming は、選んでいるものの名前の編集に入る", () => {
  const { current } = setup(["title"]);

  act(() => current().hook.startRenaming());

  expect(EditorState.renamingName(current().editor.state)).toEqual(
    Option.some("title"),
  );
});

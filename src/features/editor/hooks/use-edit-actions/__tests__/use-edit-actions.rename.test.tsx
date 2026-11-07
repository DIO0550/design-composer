import { act } from "@testing-library/react";
import { expect, test } from "vitest";
import { renderHookOnEditTargets } from "@/features/editor/__tests__/hook-in-editor";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { useEditActions } from "../index";

test("startRenaming は、選んでいるものの名前の編集に入る", () => {
  const { current } = renderHookOnEditTargets(useEditActions, ["title"]);

  act(() => current().hook.startRenaming());

  expect(EditorState.renamingName(current().editor.state)).toEqual(
    Option.some("title"),
  );
});

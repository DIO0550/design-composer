import { act } from "@testing-library/react";
import { expect, test } from "vitest";
import { childPositionNamed } from "@/features/editor/__tests__/editor-state-reads";
import { renderHookOnEditTargets } from "@/features/editor/__tests__/hook-in-editor";
import { Option } from "@/utils/Option";
import { useEditActions } from "../index";

/*
 * コピー & ペーストと複製が、選択とコピー済みのものから行き先を決めることを確かめる
 * （docs/06-ui.md「編集操作の一覧」）。
 */

test("copy で選んでいるものをコピーすると、別の Box を選んで貼れる", () => {
  const { current } = renderHookOnEditTargets(useEditActions, ["title"]);

  act(() => current().hook.copy());
  act(() => current().editor.dispatch({ type: "select", name: "panel" }));
  act(() => current().editor.dispatch({ type: "paste_copied" }));

  expect(childPositionNamed(current().editor.state, "title-2")).toEqual(
    Option.some({ parentName: "panel", index: 1 }),
  );
});

test("paste は、コピー済みのものを選んでいる Box の子の末尾へ貼る", () => {
  const { current } = renderHookOnEditTargets(useEditActions, []);
  act(() => current().editor.dispatch({ type: "select", name: "title" }));
  act(() => current().editor.dispatch({ type: "copy_selected" }));
  act(() => current().editor.dispatch({ type: "select", name: "panel" }));

  act(() => current().hook.paste());

  expect(childPositionNamed(current().editor.state, "title-2")).toEqual(
    Option.some({ parentName: "panel", index: 1 }),
  );
});

test("duplicateSelected は、選んでいるものの複製をその直後へ挿す", () => {
  const { current } = renderHookOnEditTargets(useEditActions, ["title"]);

  act(() => current().hook.duplicateSelected());

  expect(childPositionNamed(current().editor.state, "title-2")).toEqual(
    Option.some({ parentName: "home", index: 1 }),
  );
});

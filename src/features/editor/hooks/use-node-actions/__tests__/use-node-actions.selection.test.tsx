import { act } from "@testing-library/react";
import { expect, test } from "vitest";
import { SelectionDigs } from "@/domains/session/selection-dig";
import { UnderPointer } from "@/domains/session/under-pointer";
import {
  childPositionNamed,
  selectedNames,
} from "@/features/editor/__tests__/editor-state-reads";
import { renderHookOnEditTargets } from "@/features/editor/__tests__/hook-in-editor";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { useNodeActions } from "../index";

/*
 * ツリー・キャンバス・エラー行から届く選択の操作が、それぞれの選び方で選択を変えることを
 * 確かめる（docs/06-ui.md「選択」）。
 */

test("select は、複数選んでいても指した 1 つだけを選ぶ", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, [
    "title",
    "footer",
  ]);

  act(() => current().hook.select("title"));

  expect(selectedNames(current().editor.state)).toEqual(["title"]);
});

test("select でドキュメントに無い名前を指すと、何も選んでいない状態になる", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["title"]);

  act(() => current().hook.select("missing"));

  expect(selectedNames(current().editor.state)).toEqual([]);
});

test("selectIfUnselected は、指したものが既に選択に入っていれば選択を変えない", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, [
    "title",
    "footer",
  ]);

  act(() => current().hook.selectIfUnselected("title"));

  expect(selectedNames(current().editor.state)).toEqual(["title", "footer"]);
});

test("selectIfUnselected は、指したものが選択に入っていなければそれだけを選ぶ", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, [
    "title",
    "footer",
  ]);

  act(() => current().hook.selectIfUnselected("panel"));

  expect(selectedNames(current().editor.state)).toEqual(["panel"]);
});

test("reveal は、エラーが指すノードを選び、名前の編集には入らない", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["title"]);

  act(() => current().hook.reveal("panel"));

  const { state } = current().editor;
  expect({
    selected: selectedNames(state),
    renamingName: EditorState.renamingName(state),
  }).toEqual({ selected: ["panel"], renamingName: Option.none });
});

test("reveal でドキュメントに無い名前を指すと、選択は変わらない", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["title"]);

  act(() => current().hook.reveal("missing"));

  expect(selectedNames(current().editor.state)).toEqual(["title"]);
});

test("selectAt は、ポインタの下にあるもののうち、掘る量で決まる深さのものを選ぶ", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["title"]);

  act(() =>
    current().hook.selectAt(
      UnderPointer.create(
        ["panel-label", "panel", "home"],
        SelectionDigs.NoDeeper,
      ),
    ),
  );

  expect(selectedNames(current().editor.state)).toEqual(["panel"]);
});

test("selectInRange は、範囲に重なったものをまとめて選ぶ", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["title"]);

  act(() => current().hook.selectInRange(["panel", "footer"]));

  expect(selectedNames(current().editor.state)).toEqual(["panel", "footer"]);
});

test("clearSelection は、ドキュメントを変えずに選択だけを外す", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["title"]);

  act(() => current().hook.clearSelection());

  const { state } = current().editor;
  expect({
    selected: selectedNames(state),
    title: childPositionNamed(state, "title"),
  }).toEqual({
    selected: [],
    title: Option.some({ parentName: "home", index: 0 }),
  });
});

test("selectAllInstances は、選んでいるインスタンスと同じ部品を指すインスタンスをまとめて選ぶ", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["home-card"]);

  act(() => current().hook.selectAllInstances());

  expect(selectedNames(current().editor.state)).toEqual([
    "home-card",
    "other-card",
  ]);
});

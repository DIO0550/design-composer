import { act } from "@testing-library/react";
import { expect, test } from "vitest";
import { AxisLength } from "@/domains/dcmp/axis-length";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node, PropEdit } from "@/domains/dcmp/node";
import { ResizeEdit } from "@/domains/dcmp/resize-edit";
import { EditContinuities } from "@/domains/session/edit-continuity";
import { Axes } from "@/domains/unit/axis";
import { nodeNamed } from "@/features/editor/__tests__/editor-state-reads";
import { renderHookOnEditTargets } from "@/features/editor/__tests__/hook-in-editor";
import { EditorState } from "@/features/editor/domains/editor-state";
import { useNodeActions } from "../index";

/*
 * プロパティパネル・キャンバスから届く値の編集が、それぞれの書き込み先へ届き、渡した続き方が
 * 履歴のまとまりに効くことを確かめる（docs/06-ui.md「編集操作の一覧」の undo / redo）。
 */

test("editProp は、選んでいるノードの prop を書き換える", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["title"]);

  act(() =>
    current().hook.editProp(
      PropEdit.set(["content"], "a"),
      EditContinuities.Separate,
    ),
  );

  const title = nodeNamed(current().editor.state, "title");
  expect(Node.writtenPropsOf(title).content).toBe("a");
});

test("editRefOwnProp は、選んでいるインスタンス自身の値を書き換える", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["home-card"]);

  act(() =>
    current().hook.editRefOwnProp(
      PropEdit.set(["locking"], "locked"),
      EditContinuities.Separate,
    ),
  );

  expect(
    DesignDocument.isLocked(
      EditorState.document(current().editor.state),
      "home-card",
    ),
  ).toBe(true);
});

test("resize は、選んでいるノードの大きさを書き換える", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["panel"]);

  act(() =>
    current().hook.resize(
      ResizeEdit.create([AxisLength.create(Axes.Width, 200)]),
      EditContinuities.Separate,
    ),
  );

  const panel = nodeNamed(current().editor.state, "panel");
  expect(Node.writtenPropsOf(panel).width).toBe(200);
});

test("editProp で続きとして送った編集は、直前の編集と一緒に 1 回の undo で戻る", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["title"]);
  act(() =>
    current().editor.dispatch({
      type: "apply_prop_edit",
      edit: PropEdit.set(["content"], "a"),
      continuity: EditContinuities.Separate,
    }),
  );

  act(() =>
    current().hook.editProp(
      PropEdit.set(["content"], "ab"),
      EditContinuities.Continued,
    ),
  );
  act(() => current().editor.dispatch({ type: "undo" }));

  const title = nodeNamed(current().editor.state, "title");
  expect(Node.writtenPropsOf(title).content).toBe("見出し");
});

test("editRefOwnProp で続きとして送った編集は、直前の編集と一緒に 1 回の undo で戻る", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["home-card"]);
  act(() =>
    current().editor.dispatch({
      type: "apply_ref_own_prop_edit",
      edit: PropEdit.set(["locking"], "locked"),
      continuity: EditContinuities.Separate,
    }),
  );

  act(() =>
    current().hook.editRefOwnProp(
      PropEdit.set(["locking"], "unlocked"),
      EditContinuities.Continued,
    ),
  );
  act(() => current().editor.dispatch({ type: "undo" }));

  expect(
    DesignDocument.isLocked(
      EditorState.document(current().editor.state),
      "home-card",
    ),
  ).toBe(false);
});

test("resize で続きとして送った編集は、直前の編集と一緒に 1 回の undo で戻る", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["panel"]);
  act(() =>
    current().editor.dispatch({
      type: "resize",
      edit: ResizeEdit.create([AxisLength.create(Axes.Width, 200)]),
      continuity: EditContinuities.Separate,
    }),
  );

  act(() =>
    current().hook.resize(
      ResizeEdit.create([AxisLength.create(Axes.Width, 240)]),
      EditContinuities.Continued,
    ),
  );
  act(() => current().editor.dispatch({ type: "undo" }));

  const panel = nodeNamed(current().editor.state, "panel");
  expect(Node.writtenPropsOf(panel).width).toBeUndefined();
});

test("editProp で別の編集として送った編集は、1 回の undo でその編集だけが戻る", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["title"]);
  act(() =>
    current().editor.dispatch({
      type: "apply_prop_edit",
      edit: PropEdit.set(["content"], "a"),
      continuity: EditContinuities.Separate,
    }),
  );

  act(() =>
    current().hook.editProp(
      PropEdit.set(["content"], "ab"),
      EditContinuities.Separate,
    ),
  );
  act(() => current().editor.dispatch({ type: "undo" }));

  const title = nodeNamed(current().editor.state, "title");
  expect(Node.writtenPropsOf(title).content).toBe("a");
});

test("editRefOwnProp で別の編集として送った編集は、1 回の undo でその編集だけが戻る", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["home-card"]);
  act(() =>
    current().editor.dispatch({
      type: "apply_ref_own_prop_edit",
      edit: PropEdit.set(["locking"], "locked"),
      continuity: EditContinuities.Separate,
    }),
  );

  act(() =>
    current().hook.editRefOwnProp(
      PropEdit.set(["locking"], "unlocked"),
      EditContinuities.Separate,
    ),
  );
  act(() => current().editor.dispatch({ type: "undo" }));

  expect(
    DesignDocument.isLocked(
      EditorState.document(current().editor.state),
      "home-card",
    ),
  ).toBe(true);
});

test("resize で別の編集として送った編集は、1 回の undo でその編集だけが戻る", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["panel"]);
  act(() =>
    current().editor.dispatch({
      type: "resize",
      edit: ResizeEdit.create([AxisLength.create(Axes.Width, 200)]),
      continuity: EditContinuities.Separate,
    }),
  );

  act(() =>
    current().hook.resize(
      ResizeEdit.create([AxisLength.create(Axes.Width, 240)]),
      EditContinuities.Separate,
    ),
  );
  act(() => current().editor.dispatch({ type: "undo" }));

  const panel = nodeNamed(current().editor.state, "panel");
  expect(Node.writtenPropsOf(panel).width).toBe(200);
});

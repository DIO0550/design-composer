import { act } from "@testing-library/react";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node } from "@/domains/dcmp/node";
import { EditorState } from "@/features/editor/domains/editor-state";
import { ReorderSteps } from "@/features/editor/domains/reorder-step";
import { Option } from "@/utils/Option";
import { setup } from "./setup";

/*
 * 対象を渡さない木の編集が、選んでいるものへ届くことを確かめる
 * （docs/06-ui.md「編集操作の一覧」）。
 */

test("removeSelected は、選んでいるノードを消す", () => {
  const { current } = setup(["title"]);

  act(() => current().hook.removeSelected());

  expect(
    DesignDocument.findNode(
      EditorState.document(current().editor.state),
      "title",
    ),
  ).toEqual(Option.none);
});

test("reorderSelected で前面へ送ると、選んでいるノードが兄弟の並びで 1 つ後ろへ動く", () => {
  const { current } = setup(["panel"]);

  act(() => current().hook.reorderSelected(ReorderSteps.TowardFront));

  expect(
    DesignDocument.findChildPosition(
      EditorState.document(current().editor.state),
      "panel",
    ),
  ).toEqual(Option.some({ parentName: "home", index: 3 }));
});

test("reorderSelected で背面へ送ると、選んでいるノードが兄弟の並びで 1 つ前へ動く", () => {
  const { current } = setup(["panel"]);

  act(() => current().hook.reorderSelected(ReorderSteps.TowardBack));

  expect(
    DesignDocument.findChildPosition(
      EditorState.document(current().editor.state),
      "panel",
    ),
  ).toEqual(Option.some({ parentName: "home", index: 1 }));
});

test("repositionSelectedBy は、選んでいる絶対配置のノードの座標を渡した量だけずらす", () => {
  const { current } = setup(["footer"]);

  act(() => current().hook.repositionSelectedBy({ x: 5, y: -4 }));

  const footer = Option.unwrap(
    DesignDocument.findNode(
      EditorState.document(current().editor.state),
      "footer",
    ),
  );
  expect(Node.writtenPropsOf(footer)).toMatchObject({ x: 45, y: 20 });
});

test("groupSelected は、選んでいるノードを新しい Box の中へ入れる", () => {
  const { current } = setup(["title", "panel"]);

  act(() => current().hook.groupSelected());

  const document = EditorState.document(current().editor.state);
  const parentName = Option.unwrap(
    DesignDocument.findChildPosition(document, "title"),
  ).parentName;
  expect(
    Option.unwrap(DesignDocument.findNode(document, parentName)),
  ).toMatchObject({ type: "Box" });
});

test("ungroupSelected は、選んでいる Box を外して子を親へ戻す", () => {
  const { current } = setup(["title", "panel"]);
  act(() => current().editor.dispatch({ type: "group_selected" }));

  act(() => current().hook.ungroupSelected());

  expect(
    DesignDocument.findChildPosition(
      EditorState.document(current().editor.state),
      "title",
    ),
  ).toEqual(Option.some({ parentName: "home", index: 1 }));
});

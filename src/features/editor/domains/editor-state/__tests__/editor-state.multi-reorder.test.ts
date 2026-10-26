import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import {
  type ReorderStep,
  ReorderSteps,
} from "@/features/editor/domains/reorder-step";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";
import { childNames } from "./setup";

/** home の下に a, x, b, y, group（左が背面）。group の子は inner-1, inner-2。 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            { name: "a", type: "Box" },
            { name: "x", type: "Box" },
            { name: "b", type: "Box" },
            { name: "y", type: "Box" },
            {
              name: "group",
              type: "Box",
              children: [
                { name: "inner-1", type: "Box" },
                { name: "inner-2", type: "Box" },
              ],
            },
          ],
        },
      ],
    }),
  );
}

function reorderSelected(
  names: readonly string[],
  step: ReorderStep,
): Option<EditorState> {
  return EditorState.reorderSelectedNodes(
    EditorState.selectNodes(setupState(), names),
    step,
  );
}

test("離れた兄弟をまとめて前面へ動かすと、それぞれ 1 つずつ前面へずれる", () => {
  const reordered = Option.unwrap(
    reorderSelected(["a", "b"], ReorderSteps.TowardFront),
  );

  expect(childNames(reordered, "home")).toEqual(["x", "a", "y", "b", "group"]);
});

test("隣り合う兄弟をまとめて前面へ動かすと、並び順を保ったまま 1 つ前面へずれる", () => {
  const reordered = Option.unwrap(
    reorderSelected(["a", "x"], ReorderSteps.TowardFront),
  );

  expect(childNames(reordered, "home")).toEqual(["b", "a", "x", "y", "group"]);
});

test("離れた兄弟をまとめて背面へ動かすと、それぞれ 1 つずつ背面へずれる", () => {
  const reordered = Option.unwrap(
    reorderSelected(["x", "y"], ReorderSteps.TowardBack),
  );

  expect(childNames(reordered, "home")).toEqual(["x", "a", "y", "b", "group"]);
});

test("隣り合う兄弟をまとめて背面へ動かすと、並び順を保ったまま 1 つ背面へずれる", () => {
  const reordered = Option.unwrap(
    reorderSelected(["b", "y"], ReorderSteps.TowardBack),
  );

  expect(childNames(reordered, "home")).toEqual(["a", "b", "y", "x", "group"]);
});

test("1 つでも最前面にいるものを選んでいると、前面へは動かせない", () => {
  expect(Option.isSome(reorderSelected(["a"], ReorderSteps.TowardFront))).toBe(
    true,
  );
  expect(
    Option.isSome(reorderSelected(["a", "group"], ReorderSteps.TowardFront)),
  ).toBe(false);
});

test("1 つでも最背面にいるものを選んでいると、背面へは動かせない", () => {
  expect(Option.isSome(reorderSelected(["b"], ReorderSteps.TowardBack))).toBe(
    true,
  );
  expect(
    Option.isSome(reorderSelected(["a", "b"], ReorderSteps.TowardBack)),
  ).toBe(false);
});

test("親が違うノードを選んでいると、まとめては動かせない", () => {
  expect([
    Option.isSome(reorderSelected(["a"], ReorderSteps.TowardFront)),
    Option.isSome(reorderSelected(["inner-1"], ReorderSteps.TowardFront)),
  ]).toEqual([true, true]);
  expect(
    Option.isSome(reorderSelected(["a", "inner-1"], ReorderSteps.TowardFront)),
  ).toBe(false);
});

test("まとめて動かしたあと、1 回の取り消しで元の並びに戻る", () => {
  const reordered = Option.unwrap(
    reorderSelected(["a", "b"], ReorderSteps.TowardFront),
  );

  const undone = Option.unwrap(EditorState.undo(reordered));

  expect(childNames(undone, "home")).toEqual(["a", "x", "b", "y", "group"]);
});

test("まとめて動かしても、選んでいたノードは選ばれたままになる", () => {
  const reordered = Option.unwrap(
    reorderSelected(["a", "b"], ReorderSteps.TowardFront),
  );

  expect(
    DocumentSelection.names(EditorState.documentSelection(reordered)),
  ).toEqual(["a", "b"]);
});

test("まとめて前面へ動かしてから背面へ動かすと、元の並びに戻る", () => {
  const forward = Option.unwrap(
    reorderSelected(["a", "b"], ReorderSteps.TowardFront),
  );

  const backward = Option.unwrap(
    EditorState.reorderSelectedNodes(forward, ReorderSteps.TowardBack),
  );

  expect(childNames(backward, "home")).toEqual(["a", "x", "b", "y", "group"]);
});

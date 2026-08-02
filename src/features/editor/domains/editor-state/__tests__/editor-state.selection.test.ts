import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { EditorState } from "../index";

function setupDocument(): DesignDocument {
  return DesignDocument.create({
    components: { card: { type: "Box" } },
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [{ name: "title", type: "Text" }],
      },
    ],
  });
}

test("ドキュメントを開いた直後は何も選択されていない", () => {
  const state = EditorState.create(setupDocument());

  expect(state.selectedName.some).toBe(false);
});

test("artboard を選ぶとその artboard が選択状態になる", () => {
  const state = EditorState.select(EditorState.create(setupDocument()), "home");

  expect(EditorState.isSelected(state, "home")).toBe(true);
});

test("artboard 配下のノードを選ぶとそのノードが選択状態になる", () => {
  const state = EditorState.select(
    EditorState.create(setupDocument()),
    "title",
  );

  expect(EditorState.isSelected(state, "title")).toBe(true);
});

test("ドキュメントに存在しない名前を選ぼうとしても選択状態にならない", () => {
  const state = EditorState.select(
    EditorState.create(setupDocument()),
    "unknown",
  );

  expect(state.selectedName.some).toBe(false);
});

test("キャンバスに描かれない部品定義の名前は選択状態にならない", () => {
  const state = EditorState.select(EditorState.create(setupDocument()), "card");

  expect(state.selectedName.some).toBe(false);
});

test("選択を解除すると何も選択されていない状態に戻る", () => {
  const selected = EditorState.select(
    EditorState.create(setupDocument()),
    "home",
  );

  expect(EditorState.clearSelection(selected).selectedName.some).toBe(false);
});

test("選択中でない名前は選択状態ではない", () => {
  const state = EditorState.select(EditorState.create(setupDocument()), "home");

  expect(EditorState.isSelected(state, "title")).toBe(false);
});

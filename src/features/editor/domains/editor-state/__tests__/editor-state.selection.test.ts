import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
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

  expect(EditorState.singleName(state).some).toBe(false);
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

  expect(EditorState.singleName(state).some).toBe(false);
});

test("キャンバスに描かれない部品定義の名前は選択状態にならない", () => {
  const state = EditorState.select(EditorState.create(setupDocument()), "card");

  expect(EditorState.singleName(state).some).toBe(false);
});

test("選択を解除すると何も選択されていない状態に戻る", () => {
  const selected = EditorState.select(
    EditorState.create(setupDocument()),
    "home",
  );

  expect(
    EditorState.singleName(EditorState.clearSelection(selected)).some,
  ).toBe(false);
});

test("選択中でない名前は選択状態ではない", () => {
  const state = EditorState.select(EditorState.create(setupDocument()), "home");

  expect(EditorState.isSelected(state, "title")).toBe(false);
});

/** `home` の直下に `title` と `caption` が並ぶドキュメント。まとめて選ぶ相手にする。 */
function setupSiblingDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text" },
          { name: "caption", type: "Text" },
        ],
      },
    ],
  });
}

test("名前を指してまとめて選ぶと、そのすべてが選択状態になる", () => {
  const state = EditorState.selectNodes(
    EditorState.create(setupSiblingDocument()),
    ["title", "caption"],
  );

  expect([
    EditorState.isSelected(state, "title"),
    EditorState.isSelected(state, "caption"),
  ]).toEqual([true, true]);
});

test("まとめて選ぶとき、ドキュメントに無い名前は落とされる", () => {
  // 選べる名前を 1 つ混ぜて対照にする（すべて落とす実装でも通らないようにする）
  const state = EditorState.selectNodes(
    EditorState.create(setupSiblingDocument()),
    ["title", "missing"],
  );

  expect([
    EditorState.isSelected(state, "title"),
    EditorState.isSelected(state, "missing"),
  ]).toEqual([true, false]);
});

test("まとめて選ぶ相手が 1 つも無ければ未選択に戻る", () => {
  const selected = EditorState.select(
    EditorState.create(setupSiblingDocument()),
    "title",
  );

  const state = EditorState.selectNodes(selected, []);

  expect(EditorState.isSelected(state, "title")).toBe(false);
});

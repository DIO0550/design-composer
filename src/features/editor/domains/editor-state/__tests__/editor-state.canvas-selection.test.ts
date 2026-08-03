import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { EditorState } from "../index";

/**
 * キャンバスから届く候補は「押された要素から外へ辿った名前」なので、
 * インスタンスの中身を押した場合は部品定義側のノード名が先に並ぶ。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    components: {
      "primary-button": {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
      },
    },
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text" },
          { name: "home-login", ref: "primary-button" },
        ],
      },
    ],
  });
}

test("ノードを押すとそのノードが選択状態になる", () => {
  const state = EditorState.selectInnermost(
    EditorState.create(setupDocument()),
    ["title", "home"],
  );

  expect(EditorState.isSelected(state, "title")).toBe(true);
});

test("部品インスタンスの中身を押すとインスタンス自身が選択状態になる", () => {
  const state = EditorState.selectInnermost(
    EditorState.create(setupDocument()),
    ["button-label", "home-login", "home"],
  );

  expect(EditorState.isSelected(state, "home-login")).toBe(true);
});

test("artboard の中で何も指していなければ artboard が選択状態になる", () => {
  const state = EditorState.selectInnermost(
    EditorState.create(setupDocument()),
    ["home"],
  );

  expect(EditorState.isSelected(state, "home")).toBe(true);
});

test("どれも選択できない候補しか無ければ選択は外れる", () => {
  const selected = EditorState.select(
    EditorState.create(setupDocument()),
    "title",
  );

  const state = EditorState.selectInnermost(selected, ["unknown"]);

  expect(state.selectedName.some).toBe(false);
});

test("候補が1つも無ければ選択は外れる", () => {
  const selected = EditorState.select(
    EditorState.create(setupDocument()),
    "title",
  );

  const state = EditorState.selectInnermost(selected, []);

  expect(state.selectedName.some).toBe(false);
});

test("押した場所を変えても元の状態は変わらない", () => {
  const selected = EditorState.select(
    EditorState.create(setupDocument()),
    "title",
  );

  EditorState.selectInnermost(selected, ["home"]);

  expect(EditorState.isSelected(selected, "title")).toBe(true);
});

import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/**
 * 今見ている artboard は選択から導かれる（docs/06-ui.md「選択」/ #112）。
 * 2 枚の artboard と、その一方の孫まで持つ木で場合分けを見る。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [
          {
            name: "body",
            type: "Box",
            children: [{ name: "body-text", type: "Text" }],
          },
        ],
      },
      {
        name: "settings",
        width: 375,
        height: 812,
        children: [{ name: "settings-title", type: "Text" }],
      },
    ],
  });
}

/** 今見ている artboard の名前。無ければテストを落とす。 */
function currentName(state: EditorState): string {
  return Option.unwrap(EditorState.currentArtboard(state)).name;
}

test("何も選んでいないときは先頭の artboard を見ている", () => {
  const state = EditorState.create(setupDocument());

  expect(currentName(state)).toBe("home");
});

test("artboard を選ぶとその artboard を見ている", () => {
  const state = EditorState.select(
    EditorState.create(setupDocument()),
    "settings",
  );

  expect(currentName(state)).toBe("settings");
});

test("ノードを選ぶとそれを載せている artboard を見ている", () => {
  const state = EditorState.select(
    EditorState.create(setupDocument()),
    "settings-title",
  );

  expect(currentName(state)).toBe("settings");
});

test("孫ノードを選んでもそれを載せている artboard を見ている", () => {
  const state = EditorState.select(
    EditorState.create(setupDocument()),
    "body-text",
  );

  expect(currentName(state)).toBe("home");
});

test("ドキュメントに無い名前を選んでも選択は成立しないので先頭の artboard を見ている", () => {
  const state = EditorState.select(
    EditorState.create(setupDocument()),
    "ghost",
  );

  expect(currentName(state)).toBe("home");
});

test("artboard が1枚も無いときは見ている artboard が無い", () => {
  const state = EditorState.create(DesignDocument.create({ artboards: [] }));

  expect(EditorState.currentArtboard(state).some).toBe(false);
});

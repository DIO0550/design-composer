import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import { SelectionState } from "@/domains/selection-state";
import { Option } from "@/utils/Option";

/**
 * 今見ている artboard は選択から導かれる（docs/06-ui.md「選択」/ #112）。
 *
 * ノードはすべて 2 枚目（`settings`）にぶら下げる。先頭の `home` に置くと、
 * 「ノードから artboard を辿る」規則を壊しても「選択なしは先頭」の既定で
 * 同じ答えになり、テストが落ちなくなるため。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      { name: "home", width: 375, height: 812, children: [] },
      {
        name: "settings",
        width: 375,
        height: 812,
        children: [
          { name: "settings-title", type: "Text" },
          {
            name: "body",
            type: "Box",
            children: [{ name: "body-text", type: "Text" }],
          },
        ],
      },
    ],
  });
}

/** その名前を選んでいる状態の対。 */
function setupSelecting(...names: readonly string[]): DocumentSelection {
  return DocumentSelection.create(
    setupDocument(),
    SelectionState.create(names),
  );
}

/** 今見ている artboard の名前。無ければテストを落とす。 */
function currentName(selection: DocumentSelection): string {
  return Option.unwrap(DocumentSelection.currentArtboard(selection)).name;
}

test("何も選んでいないときは先頭の artboard を見ている", () => {
  expect(currentName(setupSelecting())).toBe("home");
});

test("artboard を選んでいるときはその artboard を見ている", () => {
  expect(currentName(setupSelecting("settings"))).toBe("settings");
});

test("ノードを選んでいるときはそれを載せている artboard を見ている", () => {
  expect(currentName(setupSelecting("settings-title"))).toBe("settings");
});

test("孫ノードを選んでいるときもそれを載せている artboard を見ている", () => {
  expect(currentName(setupSelecting("body-text"))).toBe("settings");
});

/*
 * 対は選択を映すだけで、名前がドキュメントに在ることを検証しない（型の doc）。
 * 在らない名前はここで先頭へ落ちる。
 */
test("選んでいる名前がドキュメントに無いときは先頭の artboard を見ている", () => {
  expect(currentName(setupSelecting("ghost"))).toBe("home");
});

test("複数選んでいるときは先頭の名前を載せている artboard を見ている", () => {
  expect(currentName(setupSelecting("settings-title", "home"))).toBe(
    "settings",
  );
});

test("artboard が1枚も無いときは見ている artboard が無い", () => {
  const selection = DocumentSelection.create(
    DesignDocument.create({ artboards: [] }),
    SelectionState.None,
  );

  expect(DocumentSelection.currentArtboard(selection).some).toBe(false);
});

import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import type { DocumentError } from "@/features/editor/domains/document-error";
import { EditorState } from "../index";

/** 外部エディタが不正なファイルを保存したときに届くエラー。 */
const SYNTAX_ERROR: DocumentError = {
  kind: "syntax-error",
  message: "expected ',' or '}'",
  location: { kind: "text-position", position: 42 },
};

/** artboard を 1 枚だけ持つドキュメントを開いた直後の状態。 */
function openedState(artboardName: string): EditorState {
  return EditorState.create(
    DesignDocument.create({
      artboards: [
        { name: artboardName, width: 375, height: 812, children: [] },
      ],
    }),
  );
}

test("取り込めた外部変更のドキュメントが表示対象になる", () => {
  const opened = EditorState.create(DesignDocument.create({ artboards: [] }));
  const reloaded = DesignDocument.create({
    artboards: [{ name: "home", width: 375, height: 812, children: [] }],
  });

  const state = EditorState.applyReload(opened, {
    kind: "reloaded",
    document: reloaded,
  });

  expect(EditorState.document(state)).toEqual(reloaded);
});

test("取り込んだドキュメントにも同じ名前があれば選択は引き継がれる", () => {
  const selected = EditorState.select(openedState("home"), "home");
  const reloaded = DesignDocument.create({
    artboards: [{ name: "home", width: 414, height: 896, children: [] }],
  });

  const state = EditorState.applyReload(selected, {
    kind: "reloaded",
    document: reloaded,
  });

  expect(EditorState.isSelected(state, "home")).toBe(true);
});

test("取り込んだドキュメントから選択中の名前が消えていると選択は外れる", () => {
  const selected = EditorState.select(openedState("home"), "home");
  const reloaded = DesignDocument.create({
    artboards: [{ name: "settings", width: 375, height: 812, children: [] }],
  });

  const state = EditorState.applyReload(selected, {
    kind: "reloaded",
    document: reloaded,
  });

  expect(state.selectedName.some).toBe(false);
});

test("外部変更を拒んだときは表示中のドキュメントがそのまま残る", () => {
  const opened = openedState("home");

  const state = EditorState.applyReload(opened, {
    kind: "rejected",
    errors: [SYNTAX_ERROR],
  });

  expect(EditorState.document(state)).toEqual(EditorState.document(opened));
});

test("外部変更を拒んでも選択は外れない", () => {
  const selected = EditorState.select(openedState("home"), "home");

  const state = EditorState.applyReload(selected, {
    kind: "rejected",
    errors: [SYNTAX_ERROR],
  });

  expect(EditorState.isSelected(state, "home")).toBe(true);
});

test("外部変更を拒むと、その理由がファイルのエラー一覧として画面に載る", () => {
  const state = EditorState.applyReload(openedState("home"), {
    kind: "rejected",
    errors: [SYNTAX_ERROR],
  });

  expect(state.fileErrors).toStrictEqual([SYNTAX_ERROR]);
});

test("ファイルが直って取り込めるようになるとファイルのエラー一覧は消える", () => {
  const rejected = EditorState.applyReload(openedState("home"), {
    kind: "rejected",
    errors: [SYNTAX_ERROR],
  });
  const fixed = DesignDocument.create({
    artboards: [{ name: "home", width: 414, height: 896, children: [] }],
  });

  const state = EditorState.applyReload(rejected, {
    kind: "reloaded",
    document: fixed,
  });

  expect(state.fileErrors).toStrictEqual([]);
});

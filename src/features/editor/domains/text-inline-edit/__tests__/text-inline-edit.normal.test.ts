import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { PropEdit } from "@/domains/node";
import { EditorState } from "@/features/editor/domains/editor-state";
import type { CanvasBounds } from "@/features/editor/domains/node-drop";
import {
  EditableText,
  TextInlineEdit,
} from "@/features/editor/domains/text-inline-edit";
import { Option } from "@/utils/Option";

/**
 * `home` に、文言を持つ `title`、文言を設定していない `caption`、
 * Box の `panel`、部品インスタンスの `action` が並ぶ状態。
 */
function setupState(selectedName?: string): EditorState {
  const state = EditorState.create(
    DesignDocument.create({
      components: { card: { type: "Box", children: [] } },
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            { name: "title", type: "Text", props: { content: "ホーム" } },
            { name: "caption", type: "Text" },
            { name: "panel", type: "Box", children: [] },
            { name: "action", ref: "card" },
          ],
        },
      ],
    }),
  );
  return selectedName === undefined
    ? state
    : EditorState.select(state, selectedName);
}

/** 画面の (100, 50) に 80x20 で描かれている、という前提。 */
const TITLE_BOUNDS: CanvasBounds = {
  left: 100,
  top: 50,
  width: 80,
  height: 20,
};

test("選択中の Text を指してダブルクリックすると、その文言を編集できる", () => {
  const text = EditableText.at(setupState("title"), ["title", "home"]);

  expect(text).toEqual(Option.some({ name: "title", content: "ホーム" }));
});

test("文言を設定していない Text では既定の文言が編集の初期値になる", () => {
  const text = EditableText.at(setupState("caption"), ["caption", "home"]);

  expect(text).toEqual(Option.some({ name: "caption", content: "" }));
});

test("編集を始めると今の文言が下書きの初期値になる", () => {
  const edit = TextInlineEdit.create(
    { name: "title", content: "ホーム" },
    TITLE_BOUNDS,
  );

  expect(edit.draft).toBe("ホーム");
});

test("入力された文言で下書きが差し替わる", () => {
  const started = TextInlineEdit.create(
    { name: "title", content: "ホーム" },
    TITLE_BOUNDS,
  );

  expect(TextInlineEdit.withDraft(started, "トップ").draft).toBe("トップ");
});

test("下書きを差し替えても入力欄を重ねる位置は変わらない", () => {
  const started = TextInlineEdit.create(
    { name: "title", content: "ホーム" },
    TITLE_BOUNDS,
  );

  expect(TextInlineEdit.withDraft(started, "トップ").bounds).toEqual(
    TITLE_BOUNDS,
  );
});

test("下書きは content への編集になる", () => {
  const started = TextInlineEdit.create(
    { name: "title", content: "ホーム" },
    TITLE_BOUNDS,
  );

  expect(
    TextInlineEdit.toPropEdit(TextInlineEdit.withDraft(started, "トップ")),
  ).toEqual(PropEdit.set("content", "トップ"));
});

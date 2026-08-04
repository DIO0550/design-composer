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
 * `home` に、文言を持つ `title`、Box の `panel`、部品インスタンスの `action` が並ぶ状態。
 * 部品 `card` は中身に Text の `card-label` を持つ。
 */
function setupState(selectedName?: string): EditorState {
  const state = EditorState.create(
    DesignDocument.create({
      components: {
        card: {
          type: "Box",
          children: [
            { name: "card-label", type: "Text", props: { content: "見出し" } },
          ],
        },
      },
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            { name: "title", type: "Text", props: { content: "ホーム" } },
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

const TITLE_BOUNDS: CanvasBounds = {
  left: 100,
  top: 50,
  width: 80,
  height: 20,
};

test("何も選択していなければ Text を指しても編集できない", () => {
  expect(EditableText.at(setupState(), ["title", "home"])).toEqual(Option.none);
});

test("選択中の Text から離れたところを指すと編集できない", () => {
  expect(EditableText.at(setupState("title"), ["panel", "home"])).toEqual(
    Option.none,
  );
});

test("Box を選択中は編集できない", () => {
  expect(EditableText.at(setupState("panel"), ["panel", "home"])).toEqual(
    Option.none,
  );
});

test("artboard を選択中は編集できない", () => {
  expect(EditableText.at(setupState("home"), ["home"])).toEqual(Option.none);
});

test("部品インスタンスを選択中は編集できない", () => {
  expect(EditableText.at(setupState("action"), ["action", "home"])).toEqual(
    Option.none,
  );
});

test("部品の中身の Text を指しても編集できない", () => {
  expect(
    EditableText.at(setupState("action"), ["card-label", "action", "home"]),
  ).toEqual(Option.none);
});

test("空の下書きは content を空にする編集になる（未設定へは戻さない）", () => {
  const started = TextInlineEdit.create(
    { name: "title", content: "ホーム" },
    TITLE_BOUNDS,
  );

  expect(
    TextInlineEdit.toPropEdit(TextInlineEdit.withDraft(started, "")),
  ).toEqual(PropEdit.set("content", ""));
});

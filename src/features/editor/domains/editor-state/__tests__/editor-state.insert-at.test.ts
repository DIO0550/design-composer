import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";
import { childNames } from "./setup";

/*
 * ツリー上の位置を指した挿入（キャンバスへ落とす経路 / #203）。
 * 選択位置へ挿す `insertNode` とは挿し先の決まり方が違うので観点を分ける。
 */

/** `home` に Text・空の Box・Text がこの順で並ぶ状態。 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      components: { card: { type: "Box" } },
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            { name: "title", type: "Text" },
            { name: "body", type: "Box", children: [] },
            { name: "note", type: "Text" },
          ],
        },
      ],
    }),
  );
}

test("指した位置へ挿すと、先頭でも末尾でもない位置に入る", () => {
  // 先頭・末尾だと、位置を無視して足すだけの実装でも通ってしまう
  const inserted = EditorState.insertNodeAt(
    setupState(),
    { kind: "primitive", type: "Box" },
    { parentName: "home", index: 1 },
  );

  expect(childNames(Option.unwrap(inserted), "home")).toEqual([
    "title",
    "box",
    "body",
    "note",
  ]);
});

test("選んでいるものと違う親を指して挿すと、指した親の子になる", () => {
  // 選択を見ていたら `home` の子になる
  const state = EditorState.select(setupState(), "home");

  const inserted = EditorState.insertNodeAt(
    state,
    { kind: "primitive", type: "Text" },
    { parentName: "body", index: 0 },
  );

  expect(childNames(Option.unwrap(inserted), "body")).toEqual(["text"]);
});

test("同じ部品を続けて挿すと名前が一意に採番される", () => {
  const first = Option.unwrap(
    EditorState.insertNodeAt(
      setupState(),
      { kind: "instance", componentName: "card" },
      { parentName: "body", index: 0 },
    ),
  );

  const second = EditorState.insertNodeAt(
    first,
    { kind: "instance", componentName: "card" },
    { parentName: "body", index: 1 },
  );

  expect(childNames(Option.unwrap(second), "body")).toEqual([
    "card-2",
    "card-3",
  ]);
});

test("居ない親を指すと挿さらない", () => {
  const inserted = EditorState.insertNodeAt(
    setupState(),
    { kind: "primitive", type: "Box" },
    { parentName: "居ない親", index: 0 },
  );

  expect(inserted.some).toBe(false);
});

test("子の数を越える位置を指すと挿さらない", () => {
  const inserted = EditorState.insertNodeAt(
    setupState(),
    { kind: "primitive", type: "Box" },
    { parentName: "body", index: 1 },
  );

  expect(inserted.some).toBe(false);
});

test("挿したあとに戻すと挿す前の並びに戻る", () => {
  const inserted = Option.unwrap(
    EditorState.insertNodeAt(
      setupState(),
      { kind: "primitive", type: "Box" },
      { parentName: "home", index: 1 },
    ),
  );

  const undone = EditorState.undo(inserted);

  expect(childNames(Option.unwrap(undone), "home")).toEqual([
    "title",
    "body",
    "note",
  ]);
});

test("挿しても選択は動かない", () => {
  // 続けて挿せるのが素直な繰り返し（`insertNode` と同じ）
  const state = EditorState.select(setupState(), "title");

  const inserted = Option.unwrap(
    EditorState.insertNodeAt(
      state,
      { kind: "primitive", type: "Box" },
      { parentName: "body", index: 0 },
    ),
  );

  expect(
    DocumentSelection.names(EditorState.documentSelection(inserted)),
  ).toEqual(["title"]);
});

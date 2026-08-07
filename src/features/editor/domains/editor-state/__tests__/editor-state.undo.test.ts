import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/** artboard の下に Text 1 つを持つドキュメントを開いた状態。 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [{ name: "title", type: "Text" }],
        },
      ],
    }),
  );
}

function childNames(state: EditorState): readonly string[] {
  const artboard = Option.unwrap(
    DesignDocument.findArtboard(EditorState.document(state), "home"),
  );
  return artboard.children.map((child) => child.name);
}

test("ノードを挿してから戻すと挿す前の並びに戻る", () => {
  const selected = EditorState.select(setupState(), "home");
  const inserted = Option.unwrap(
    EditorState.insertNode(selected, { kind: "primitive", type: "Box" }),
  );

  const undone = Option.unwrap(EditorState.undo(inserted));

  expect(childNames(undone)).toEqual(["title"]);
});

test("戻したあとにやり直すと挿したあとの並びに戻る", () => {
  const selected = EditorState.select(setupState(), "home");
  const inserted = Option.unwrap(
    EditorState.insertNode(selected, { kind: "primitive", type: "Box" }),
  );
  const undone = Option.unwrap(EditorState.undo(inserted));

  const redone = Option.unwrap(EditorState.redo(undone));

  expect(childNames(redone)).toEqual(childNames(inserted));
});

test("削除を戻すと消したノードが戻る", () => {
  const selected = EditorState.select(setupState(), "title");
  const removed = Option.unwrap(EditorState.removeNode(selected));

  const undone = Option.unwrap(EditorState.undo(removed));

  expect(childNames(undone)).toEqual(["title"]);
});

test("戻すと選択が指すノードが無いときは選択が外れる", () => {
  const selected = EditorState.select(setupState(), "home");
  const inserted = Option.unwrap(
    EditorState.insertNode(selected, { kind: "primitive", type: "Box" }),
  );
  const insertedName = childNames(inserted)[1];

  const undone = Option.unwrap(
    EditorState.undo(EditorState.select(inserted, insertedName)),
  );

  expect(undone.selectedName).toEqual(Option.none);
});

test("戻しても選択が指すノードが残っていれば選択は続く", () => {
  const selected = EditorState.select(setupState(), "home");
  const inserted = Option.unwrap(
    EditorState.insertNode(selected, { kind: "primitive", type: "Box" }),
  );

  const undone = Option.unwrap(EditorState.undo(inserted));

  expect(undone.selectedName).toEqual(Option.some("home"));
});

test("戻してもクリップボードの中身は残る", () => {
  const copied = Option.unwrap(
    EditorState.copyNode(EditorState.select(setupState(), "title")),
  );
  const removed = Option.unwrap(EditorState.removeNode(copied));

  const undone = Option.unwrap(EditorState.undo(removed));

  expect(undone.copiedNode).toEqual(
    Option.some({ name: "title", type: "Text" }),
  );
});

test("選択を切り替えただけでは戻る先はできない", () => {
  const selected = EditorState.select(setupState(), "title");

  expect(EditorState.undo(selected)).toEqual(Option.none);
});

test("コピーしただけでは戻る先はできない", () => {
  const copied = Option.unwrap(
    EditorState.copyNode(EditorState.select(setupState(), "title")),
  );

  expect(EditorState.undo(copied)).toEqual(Option.none);
});

test("開いた直後は戻せない", () => {
  expect(EditorState.undo(setupState())).toEqual(Option.none);
});

test("開いた直後はやり直せない", () => {
  expect(EditorState.redo(setupState())).toEqual(Option.none);
});

test("外部変更を取り込んだあとに戻すと取り込む前のドキュメントに戻る", () => {
  const state = setupState();
  const reloaded = DesignDocument.create({
    artboards: [{ name: "home", width: 375, height: 812, children: [] }],
  });

  const undone = Option.unwrap(
    EditorState.undo(
      EditorState.applyReload(state, { kind: "reloaded", document: reloaded }),
    ),
  );

  expect(childNames(undone)).toEqual(["title"]);
});

test("外部変更を拒んだだけでは戻る先はできない", () => {
  const state = setupState();

  const rejected = EditorState.applyReload(state, {
    kind: "rejected",
    errors: [
      {
        kind: "syntax-error",
        message: "expected ',' or '}'",
        location: { kind: "text-position", position: 42 },
      },
    ],
  });

  expect(EditorState.undo(rejected)).toEqual(Option.none);
});

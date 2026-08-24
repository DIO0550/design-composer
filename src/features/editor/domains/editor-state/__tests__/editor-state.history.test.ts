import { expect, test } from "vitest";
import { ReceivedAt } from "@/domains/__tests__/instants";
import { DesignDocument } from "@/domains/design-document";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";
import { stateWithNestedBox } from "./setup";

test("削除を戻すと消したノードがツリーに返ってくる", () => {
  const removed = Option.unwrap(
    EditorState.removeNode(EditorState.select(stateWithNestedBox(), "title")),
  );

  const undone = Option.unwrap(EditorState.undo(removed));

  expect(
    DesignDocument.findNode(EditorState.document(undone), "title").some,
  ).toBe(true);
});

test("挿入を戻すと足したノードがツリーから消える", () => {
  const inserted = Option.unwrap(
    EditorState.insertNode(EditorState.select(stateWithNestedBox(), "body"), {
      kind: "primitive",
      type: "Text",
    }),
  );

  const undone = Option.unwrap(EditorState.undo(inserted));

  expect(EditorState.document(undone)).toEqual(
    EditorState.document(stateWithNestedBox()),
  );
});

test("続けて 2 回編集したあと 2 回戻すと最初のドキュメントに戻る", () => {
  const first = Option.unwrap(
    EditorState.removeNode(EditorState.select(stateWithNestedBox(), "title")),
  );
  const second = Option.unwrap(
    EditorState.removeNode(EditorState.select(first, "body-text")),
  );

  const undone = Option.unwrap(
    EditorState.undo(Option.unwrap(EditorState.undo(second))),
  );

  expect(EditorState.document(undone)).toEqual(
    EditorState.document(stateWithNestedBox()),
  );
});

test("戻した編集はやり直すと再び反映される", () => {
  const removed = Option.unwrap(
    EditorState.removeNode(EditorState.select(stateWithNestedBox(), "title")),
  );
  const undone = Option.unwrap(EditorState.undo(removed));

  const redone = Option.unwrap(EditorState.redo(undone));

  expect(
    DesignDocument.findNode(EditorState.document(redone), "title"),
  ).toEqual(Option.none);
});

test("何も編集していなければ戻せない", () => {
  expect(EditorState.undo(stateWithNestedBox()).some).toBe(false);
});

test("戻していなければやり直せない", () => {
  const removed = Option.unwrap(
    EditorState.removeNode(EditorState.select(stateWithNestedBox(), "title")),
  );

  expect(EditorState.redo(removed).some).toBe(false);
});

test("選択の切り替えは履歴に積まれない", () => {
  const selected = EditorState.select(stateWithNestedBox(), "title");

  expect(EditorState.undo(selected).some).toBe(false);
});

test("コピーは履歴に積まれない", () => {
  const copied = Option.unwrap(
    EditorState.copyNode(EditorState.select(stateWithNestedBox(), "title")),
  );

  expect(EditorState.undo(copied).some).toBe(false);
});

test("戻した結果に選択中のノードが無ければ選択は外れる", () => {
  const inserted = Option.unwrap(
    EditorState.insertNode(EditorState.select(stateWithNestedBox(), "body"), {
      kind: "primitive",
      type: "Text",
    }),
  );
  // 挿した Text は "text" として採番される（NodeTemplate.baseName）。
  const undone = Option.unwrap(
    EditorState.undo(EditorState.select(inserted, "text")),
  );

  expect(EditorState.singleName(undone).some).toBe(false);
});

test("戻した結果にも選択中のノードがあれば選択は引き継がれる", () => {
  const removed = Option.unwrap(
    EditorState.removeNode(EditorState.select(stateWithNestedBox(), "title")),
  );

  const undone = Option.unwrap(
    EditorState.undo(EditorState.select(removed, "body")),
  );

  expect(EditorState.isSelected(undone, "body")).toBe(true);
});

test("外部変更の取り込みを戻すと取り込む前のドキュメントに戻る", () => {
  const opened = stateWithNestedBox();
  const reloaded = EditorState.applyReload(
    opened,
    {
      kind: "reloaded",
      document: DesignDocument.create({
        artboards: [{ name: "home", width: 414, height: 896, children: [] }],
      }),
    },
    ReceivedAt,
  );

  const undone = Option.unwrap(EditorState.undo(reloaded));

  expect(EditorState.document(undone)).toEqual(EditorState.document(opened));
});

test("取り込みを拒んだときは履歴に積まれない", () => {
  const rejected = EditorState.applyReload(
    stateWithNestedBox(),
    {
      kind: "rejected",
      errors: [
        {
          kind: "syntax-error",
          message: "expected ',' or '}'",
          location: { kind: "text-position", position: 42 },
        },
      ],
    },
    ReceivedAt,
  );

  expect(EditorState.undo(rejected).some).toBe(false);
});

test("戻したあとに別の編集をするとやり直せなくなる", () => {
  const removed = Option.unwrap(
    EditorState.removeNode(EditorState.select(stateWithNestedBox(), "title")),
  );
  const undone = Option.unwrap(EditorState.undo(removed));

  const branched = Option.unwrap(
    EditorState.removeNode(EditorState.select(undone, "body")),
  );

  expect(EditorState.redo(branched).some).toBe(false);
});

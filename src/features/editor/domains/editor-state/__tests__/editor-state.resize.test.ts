import { expect, test } from "vitest";
import { AxisLength } from "@/domains/dcmp/axis-length";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node } from "@/domains/dcmp/node";
import { ResizeEdit } from "@/domains/dcmp/resize-edit";
import { EditContinuities } from "@/domains/session/edit-continuity";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            {
              name: "panel",
              type: "Box",
              props: { widthMode: "fixed", width: 120 },
              children: [],
            },
          ],
        },
      ],
    }),
  );
}

test("選択中のノードの大きさを変えられる", () => {
  const state = EditorState.select(setupState(), "panel");

  const resized = Option.unwrap(
    EditorState.resize(
      state,
      ResizeEdit.create([AxisLength.create("width", 200)]),
      EditContinuities.Separate,
    ),
  );

  const node = Option.unwrap(
    DesignDocument.findNode(EditorState.document(resized), "panel"),
  );
  expect(Node.isPrimitive(node) && node.props).toEqual({
    widthMode: "fixed",
    width: 200,
  });
});

test("選択中の artboard の大きさを変えられる", () => {
  const state = EditorState.select(setupState(), "home");

  const resized = Option.unwrap(
    EditorState.resize(
      state,
      ResizeEdit.create([AxisLength.create("height", 480)]),
      EditContinuities.Separate,
    ),
  );

  const artboard = Option.unwrap(
    DesignDocument.findArtboard(EditorState.document(resized), "home"),
  );
  expect(artboard.height).toBe(480);
});

test("大きさを変えても選択は動かない", () => {
  const state = EditorState.select(setupState(), "panel");

  const resized = Option.unwrap(
    EditorState.resize(
      state,
      ResizeEdit.create([AxisLength.create("width", 200)]),
      EditContinuities.Separate,
    ),
  );

  expect(EditorState.singleName(resized)).toEqual(Option.some("panel"));
});

test("何も選んでいなければ大きさは変えられない", () => {
  expect(
    EditorState.resize(
      setupState(),
      ResizeEdit.create([AxisLength.create("width", 200)]),
      EditContinuities.Separate,
    ),
  ).toEqual(Option.none);
});

test("位置も変わるリサイズを Undo すると、大きさと位置の両方が 1 回で戻る", () => {
  /*
   * 長さと位置を別々の編集として流すと、Undo 1 回で片方しか戻らない
   * （docs/06-ui.md「キャンバス直接操作」のリサイズハンドル）。
   */
  const state = EditorState.select(setupState(), "home");
  const resized = Option.unwrap(
    EditorState.resize(
      state,
      ResizeEdit.placedAt([AxisLength.create("width", 300)], { x: 60, y: 0 }),
      EditContinuities.Separate,
    ),
  );

  const undone = Option.unwrap(EditorState.undo(resized));

  const artboard = Option.unwrap(
    DesignDocument.findArtboard(EditorState.document(undone), "home"),
  );
  expect([artboard.width, artboard.canvasPosition]).toEqual([360, undefined]);
});

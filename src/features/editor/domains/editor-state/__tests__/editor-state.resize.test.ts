import { expect, test } from "vitest";
import { AxisLength } from "@/domains/dcmp/axis-length";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node } from "@/domains/dcmp/node";
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
    EditorState.resize(state, [AxisLength.create("width", 200)]),
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
    EditorState.resize(state, [AxisLength.create("height", 480)]),
  );

  const artboard = Option.unwrap(
    DesignDocument.findArtboard(EditorState.document(resized), "home"),
  );
  expect(artboard.height).toBe(480);
});

test("大きさを変えても選択は動かない", () => {
  const state = EditorState.select(setupState(), "panel");

  const resized = Option.unwrap(
    EditorState.resize(state, [AxisLength.create("width", 200)]),
  );

  expect(EditorState.singleName(resized)).toEqual(Option.some("panel"));
});

test("何も選んでいなければ大きさは変えられない", () => {
  expect(
    EditorState.resize(setupState(), [AxisLength.create("width", 200)]),
  ).toEqual(Option.none);
});

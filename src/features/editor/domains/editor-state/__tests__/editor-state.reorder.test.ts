import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            { name: "title", type: "Text" },
            { name: "body", type: "Box", children: [] },
            { name: "footer", type: "Text" },
          ],
        },
      ],
    }),
  );
}

function childNames(state: EditorState): readonly string[] {
  return Option.unwrap(
    DesignDocument.findChildren(EditorState.document(state), "home"),
  ).map((child) => child.name);
}

test("子を1つ前の位置へ動かすと兄弟の並びがその順序に変わる", () => {
  const reordered = EditorState.reorderNode(
    setupState(),
    { parentName: "home", index: 1 },
    0,
  );

  expect(childNames(Option.unwrap(reordered))).toEqual([
    "body",
    "title",
    "footer",
  ]);
});

test("子を1つ後ろの位置へ動かすと兄弟の並びがその順序に変わる", () => {
  const reordered = EditorState.reorderNode(
    setupState(),
    { parentName: "home", index: 0 },
    1,
  );

  expect(childNames(Option.unwrap(reordered))).toEqual([
    "body",
    "title",
    "footer",
  ]);
});

test("並べ替えても選択していたノードは選択されたままになる", () => {
  const selected = EditorState.select(setupState(), "footer");

  const reordered = EditorState.reorderNode(
    selected,
    { parentName: "home", index: 2 },
    0,
  );

  expect(EditorState.isSelected(Option.unwrap(reordered), "footer")).toBe(true);
});

test("並びの外を移動先に指定すると移動が無かったことになる", () => {
  const reordered = EditorState.reorderNode(
    setupState(),
    { parentName: "home", index: 0 },
    3,
  );

  expect(reordered.some).toBe(false);
});

test("存在しない親の中の子を動かそうとしても移動が無かったことになる", () => {
  const reordered = EditorState.reorderNode(
    setupState(),
    { parentName: "unknown", index: 0 },
    1,
  );

  expect(reordered.some).toBe(false);
});

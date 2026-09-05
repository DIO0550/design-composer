import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { ReorderSteps } from "@/features/editor/domains/reorder-step";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";
import { childNames } from "./setup";

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

test("子を1つ前の位置へ動かすと兄弟の並びがその順序に変わる", () => {
  const reordered = EditorState.reorderNode(
    setupState(),
    { parentName: "home", index: 1 },
    0,
  );

  expect(childNames(Option.unwrap(reordered), "home")).toEqual([
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

  expect(childNames(Option.unwrap(reordered), "home")).toEqual([
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

/*
 * 以下は選択から向きだけで動かす経路（#417）。並びの先頭 / 末尾ではなく
 * **隣と入れ替わる**ことを見るために、末尾でない位置へ動かす入力を選ぶ
 * （末尾へ動かす入力だと「1 つ動かす」と「端へ寄せる」が区別できない）。
 */
test("選んでいるノードを前面へ動かすと、次の兄弟と入れ替わる", () => {
  const selected = EditorState.select(setupState(), "title");

  const reordered = EditorState.reorderSelectedNode(
    selected,
    ReorderSteps.TowardFront,
  );

  expect(childNames(Option.unwrap(reordered), "home")).toEqual([
    "body",
    "title",
    "footer",
  ]);
});

test("選んでいるノードを背面へ動かすと、前の兄弟と入れ替わる", () => {
  const selected = EditorState.select(setupState(), "footer");

  const reordered = EditorState.reorderSelectedNode(
    selected,
    ReorderSteps.TowardBack,
  );

  expect(childNames(Option.unwrap(reordered), "home")).toEqual([
    "title",
    "footer",
    "body",
  ]);
});

test("いちばん前面のノードをさらに前面へ動かそうとしても並びは変わらない", () => {
  const selected = EditorState.select(setupState(), "footer");

  expect(
    EditorState.reorderSelectedNode(selected, ReorderSteps.TowardFront),
  ).toEqual(Option.none);
});

test("何も選んでいなければ並べ替えは存在しない", () => {
  expect(
    EditorState.reorderSelectedNode(setupState(), ReorderSteps.TowardFront),
  ).toEqual(Option.none);
});

test("artboard を選んでいるときは並べ替えは存在しない", () => {
  // artboard は誰の子でもないので、兄弟の並びの中の位置を持たない
  const selected = EditorState.select(setupState(), "home");

  expect(
    EditorState.reorderSelectedNode(selected, ReorderSteps.TowardFront),
  ).toEqual(Option.none);
});

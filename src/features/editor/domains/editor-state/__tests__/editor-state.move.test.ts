import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { Node } from "@/domains/node";
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
            { name: "alpha", type: "Text" },
            { name: "beta", type: "Text" },
            { name: "gamma", type: "Text" },
            { name: "delta", type: "Text" },
            { name: "panel", type: "Box", children: [] },
          ],
        },
        { name: "settings", width: 375, height: 812, children: [] },
      ],
    }),
  );
}

/** 名前で指した親の子の並び。artboard もノードも「子を持つもの」として同じに見る。 */
function childNames(state: EditorState, parentName: string): readonly string[] {
  const artboard = DesignDocument.findArtboard(state.document, parentName);
  return artboard.some
    ? artboard.value.children.map((child) => child.name)
    : Node.children(
        Option.unwrap(DesignDocument.findNode(state.document, parentName)),
      ).map((child) => child.name);
}

test("別の親の下へ移すとその親の指定した位置の子になる", () => {
  const moved = EditorState.moveNode(setupState(), "alpha", {
    parentName: "panel",
    index: 0,
  });

  expect(childNames(Option.unwrap(moved), "panel")).toEqual(["alpha"]);
});

test("別の親の下へ移すと元の親からは居なくなる", () => {
  const moved = EditorState.moveNode(setupState(), "alpha", {
    parentName: "panel",
    index: 0,
  });

  expect(childNames(Option.unwrap(moved), "home")).toEqual([
    "beta",
    "gamma",
    "delta",
    "panel",
  ]);
});

test("別の artboard の下へも移せる", () => {
  const moved = EditorState.moveNode(setupState(), "alpha", {
    parentName: "settings",
    index: 0,
  });

  expect(childNames(Option.unwrap(moved), "settings")).toEqual(["alpha"]);
});

test("同じ親の中で後ろへ動かすと、離した位置の手前と後ろの間に入る", () => {
  // 移動前の並び `[alpha, beta, gamma, delta, panel]` の gamma と delta の間で離す
  const moved = EditorState.moveNode(setupState(), "beta", {
    parentName: "home",
    index: 3,
  });

  expect(childNames(Option.unwrap(moved), "home")).toEqual([
    "alpha",
    "gamma",
    "beta",
    "delta",
    "panel",
  ]);
});

test("同じ親の中で前へ動かすと、離した位置の手前と後ろの間に入る", () => {
  const moved = EditorState.moveNode(setupState(), "delta", {
    parentName: "home",
    index: 1,
  });

  expect(childNames(Option.unwrap(moved), "home")).toEqual([
    "alpha",
    "delta",
    "beta",
    "gamma",
    "panel",
  ]);
});

test("同じ親の中で末尾へ動かすと末尾に入る", () => {
  const moved = EditorState.moveNode(setupState(), "alpha", {
    parentName: "home",
    index: 5,
  });

  expect(childNames(Option.unwrap(moved), "home")).toEqual([
    "beta",
    "gamma",
    "delta",
    "panel",
    "alpha",
  ]);
});

test("移したノードは選択されたままになる", () => {
  const selected = EditorState.select(setupState(), "alpha");

  const moved = EditorState.moveNode(selected, "alpha", {
    parentName: "panel",
    index: 0,
  });

  expect(EditorState.isSelected(Option.unwrap(moved), "alpha")).toBe(true);
});

test("自分の子孫の下へは移せない", () => {
  const state = EditorState.create(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            {
              name: "outer",
              type: "Box",
              children: [{ name: "inner", type: "Box", children: [] }],
            },
          ],
        },
      ],
    }),
  );

  const moved = EditorState.moveNode(state, "outer", {
    parentName: "inner",
    index: 0,
  });

  expect(moved.some).toBe(false);
});

test("ドキュメントに無いノードは移せない", () => {
  const moved = EditorState.moveNode(setupState(), "unknown", {
    parentName: "panel",
    index: 0,
  });

  expect(moved.some).toBe(false);
});

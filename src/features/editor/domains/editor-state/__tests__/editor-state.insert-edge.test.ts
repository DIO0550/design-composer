import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

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
            { name: "home-card", ref: "card" },
          ],
        },
      ],
    }),
  );
}

test("何も選んでいなければ挿せる位置が無い", () => {
  expect(EditorState.insertPosition(setupState())).toEqual(Option.none);
});

test("子を持てない Text を選んでいる間は挿せる位置が無い", () => {
  const state = EditorState.select(setupState(), "title");

  expect(EditorState.insertPosition(state)).toEqual(Option.none);
});

test("部品インスタンスを選んでいる間は挿せる位置が無い", () => {
  const state = EditorState.select(setupState(), "home-card");

  expect(EditorState.insertPosition(state)).toEqual(Option.none);
});

test("何も選んでいないときの挿入はドキュメントを変えない", () => {
  const inserted = EditorState.insertNode(setupState(), {
    kind: "primitive",
    type: "Box",
  });

  expect(inserted).toEqual(Option.none);
});

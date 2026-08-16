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
          width: 360,
          height: 240,
          children: [{ name: "home-title", type: "Text" }],
        },
      ],
    }),
  );
}

test("選択中のノードの prop を書き換えられる", () => {
  const state = EditorState.select(setupState(), "home-title");

  const edited = Option.unwrap(
    EditorState.applyPropEdit(state, {
      name: "content",
      value: Option.some("ホーム"),
    }),
  );

  const node = Option.unwrap(
    DesignDocument.findNode(EditorState.document(edited), "home-title"),
  );
  expect(node).toEqual({
    name: "home-title",
    type: "Text",
    props: { content: "ホーム" },
  });
});

test("prop を書き換えても選択は変わらない", () => {
  const state = EditorState.select(setupState(), "home-title");

  const edited = Option.unwrap(
    EditorState.applyPropEdit(state, {
      name: "content",
      value: Option.some("ホーム"),
    }),
  );

  expect(EditorState.singleName(edited)).toEqual(Option.some("home-title"));
});

test("何も選択していなければ prop の編集は起きない", () => {
  const edited = EditorState.applyPropEdit(setupState(), {
    name: "content",
    value: Option.some("ホーム"),
  });

  expect(edited.some).toBe(false);
});

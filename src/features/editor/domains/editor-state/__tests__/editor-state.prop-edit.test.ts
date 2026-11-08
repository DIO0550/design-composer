import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node } from "@/domains/dcmp/node";
import { EditContinuities } from "@/domains/session/edit-continuity";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";
import { childrenUnder, stateWithParentNamedLikeChild } from "./setup";

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
    EditorState.applyPropEdit(
      state,
      { names: ["content"], value: Option.some("ホーム") },
      EditContinuities.Separate,
    ),
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
    EditorState.applyPropEdit(
      state,
      { names: ["content"], value: Option.some("ホーム") },
      EditContinuities.Separate,
    ),
  );

  expect(EditorState.singleName(edited)).toEqual(Option.some("home-title"));
});

test("何も選択していなければ prop の編集は起きない", () => {
  const edited = EditorState.applyPropEdit(
    setupState(),
    { names: ["content"], value: Option.some("ホーム") },
    EditContinuities.Separate,
  );

  expect(Option.isSome(edited)).toBe(false);
});

test("名前が重複した文書で選んだ Box の width を props 欄から変えると、編集が終わり、子が追従する", () => {
  const state = EditorState.select(stateWithParentNamedLikeChild(), "p");

  const edited = Option.unwrap(
    EditorState.applyPropEdit(
      state,
      { names: ["width"], value: Option.some(200) },
      EditContinuities.Separate,
    ),
  );

  const child = Option.unwrap(ArrayEx.first(childrenUnder(edited, "p")));
  expect(Node.writtenPropsOf(child).x).toBe(20);
});

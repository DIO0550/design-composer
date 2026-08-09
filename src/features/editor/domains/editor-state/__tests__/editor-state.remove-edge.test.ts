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
          children: [{ name: "title", type: "Text" }],
        },
      ],
    }),
  );
}

test("artboard を選んだままの削除はドキュメントを変えない", () => {
  const state = EditorState.select(setupState(), "home");

  expect(EditorState.removeNode(state)).toEqual(Option.none);
});

test("何も選んでいないときの削除はドキュメントを変えない", () => {
  expect(EditorState.removeNode(setupState())).toEqual(Option.none);
});

import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/**
 * 左ペインの行を右クリックしたときの選び方（docs/06-ui.md「コンテキストメニュー」の
 * 「既に選んでいるものの上で押したときは選択を変えない」）。
 */
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
            { name: "body", type: "Box" },
            { name: "footer", type: "Box" },
          ],
        },
      ],
    }),
  );
}

test("選択に入っていない名前なら、その 1 つだけが選ばれる", () => {
  const state = EditorState.select(setupState(), "title");

  const next = EditorState.selectIfUnselected(state, "body");

  expect(EditorState.singleName(next)).toEqual(Option.some("body"));
});

test("複数選択に入っている名前なら、複数選択のまま変わらない", () => {
  const state = EditorState.selectNodes(setupState(), ["title", "body"]);

  const next = EditorState.selectIfUnselected(state, "body");

  expect(EditorState.isSelected(next, "title")).toBe(true);
});

test("複数選択に入っていない名前なら、その 1 つだけの選択に戻る", () => {
  const state = EditorState.selectNodes(setupState(), ["title", "body"]);

  const next = EditorState.selectIfUnselected(state, "footer");

  expect(EditorState.singleName(next)).toEqual(Option.some("footer"));
});

import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Componentization } from "../index";

/**
 * スキーマに無い `type` のノードが残っているドキュメント。
 * 不正なドキュメントも画面には残る（docs/03-schema.md「不正ファイル時の挙動」）ので、
 * この状態のノードも選択されうる。
 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [{ name: "home-unknown", type: "Unknown" }],
        },
      ],
    }),
  );
}

test("スキーマに無い型のノードを選んでいてもそれを元に部品を作れる", () => {
  const selected = EditorState.select(setupState(), "home-unknown");

  expect(Componentization.forSelection(selected)).toEqual({
    kind: "ready",
    sourceName: "home-unknown",
  });
});

test("スキーマに無い型のノードは実際に部品にできる", () => {
  const selected = EditorState.select(setupState(), "home-unknown");

  expect(EditorState.createComponent(selected, "unknown-part").some).toBe(true);
});

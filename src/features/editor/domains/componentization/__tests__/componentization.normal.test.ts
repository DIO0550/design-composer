import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Componentization } from "../index";

/** 選択の対象になりうる 3 つ（artboard / プリミティブ / インスタンス）を 1 枚に置く。 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.DEFAULT.tokens,
      components: DocumentTemplate.DEFAULT.components,
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            { name: "home-panel", type: "Box", children: [] },
            { name: "home-login", ref: "primary-button" },
          ],
        },
      ],
    }),
  );
}

test("プリミティブのノードを選んでいるとそれを元に部品を作れる", () => {
  const selected = EditorState.select(setupState(), "home-panel");

  expect(Componentization.forSelection(selected)).toEqual({
    kind: "ready",
    sourceName: "home-panel",
  });
});

test("インスタンスを選んでいると部品を作れない", () => {
  const selected = EditorState.select(setupState(), "home-login");

  expect(Componentization.forSelection(selected)).toEqual({ kind: "instance" });
});

test("artboard を選んでいると部品を作れない", () => {
  const selected = EditorState.select(setupState(), "home");

  expect(Componentization.forSelection(selected)).toEqual({ kind: "artboard" });
});

test("何も選んでいないと部品を作れない", () => {
  expect(Componentization.forSelection(setupState())).toEqual({
    kind: "unselected",
  });
});

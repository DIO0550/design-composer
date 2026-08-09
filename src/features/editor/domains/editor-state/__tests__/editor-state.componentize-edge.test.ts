import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/** 部品化できない選択と、使えない部品名（docs/06-ui.md「部品化・解除」）。 */
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
            { name: "home-title", type: "Text" },
            { name: "home-login", ref: "primary-button" },
          ],
        },
      ],
    }),
  );
}

test("何も選んでいないときは部品にできない", () => {
  expect(EditorState.createComponent(setupState(), "info-panel")).toEqual(
    Option.none,
  );
});

test("artboard を選んでいるときは部品にできない", () => {
  const selected = EditorState.select(setupState(), "home");

  expect(EditorState.createComponent(selected, "info-panel")).toEqual(
    Option.none,
  );
});

test("インスタンスを選んでいるときは部品にできない", () => {
  const selected = EditorState.select(setupState(), "home-login");

  expect(EditorState.createComponent(selected, "info-panel")).toEqual(
    Option.none,
  );
});

test("既に使われている名前では部品にできない", () => {
  const selected = EditorState.select(setupState(), "home-title");

  expect(EditorState.createComponent(selected, "primary-button")).toEqual(
    Option.none,
  );
});

test("識別子の規則を満たさない名前では部品にできない", () => {
  const selected = EditorState.select(setupState(), "home-title");

  expect(EditorState.createComponent(selected, "Info Panel")).toEqual(
    Option.none,
  );
});

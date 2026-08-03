import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/component";
import { DesignDocument } from "@/domains/design-document";
import type { Node } from "@/domains/node";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { PropControlSection } from "../index";

const COMPONENTS: ComponentSet = {
  "primary-button": {
    publicProps: { label: { node: "button-label", prop: "content" } },
    type: "Box",
    children: [
      { name: "button-label", type: "Text", props: { content: "Button" } },
    ],
  },
};

function setupInstanceState(node: Node): EditorState {
  return EditorState.select(
    EditorState.create(
      DesignDocument.create({
        components: COMPONENTS,
        artboards: [
          { name: "home", width: 360, height: 240, children: [node] },
        ],
      }),
    ),
    node.name,
  );
}

function controlOf(state: EditorState, prop: string) {
  return PropControlSection.forSelection(state)
    .flatMap((section) => section.controls)
    .find((control) => control.prop === prop);
}

test("インスタンスを選ぶと部品が公開している prop のコントロールが出る", () => {
  const state = setupInstanceState({ name: "action", ref: "primary-button" });

  expect(
    PropControlSection.forSelection(state).flatMap((section) =>
      section.controls.map((control) => control.prop),
    ),
  ).toEqual(["label"]);
});

test("公開 prop のコントロールは binding 先の prop の入力形式になる", () => {
  const state = setupInstanceState({ name: "action", ref: "primary-button" });

  expect(controlOf(state, "label")?.input).toEqual({ kind: "text" });
});

test("上書きしていない公開 prop は部品が設定している値が既定として出る", () => {
  const state = setupInstanceState({ name: "action", ref: "primary-button" });
  const control = controlOf(state, "label");

  expect(control?.value.some).toBe(false);
  expect(control?.defaultValue).toEqual(Option.some("Button"));
});

test("上書きしている公開 prop はその値がコントロールに乗る", () => {
  const state = setupInstanceState({
    name: "action",
    ref: "primary-button",
    overrides: { label: "ログイン" },
  });

  expect(controlOf(state, "label")?.value).toEqual(Option.some("ログイン"));
});

test("存在しない部品を指すインスタンスにはコントロールが出ない", () => {
  const state = setupInstanceState({ name: "action", ref: "missing" });

  expect(PropControlSection.forSelection(state)).toEqual([]);
});

test("スキーマの分からない type のノードにはコントロールが出ない", () => {
  const state = setupInstanceState({ name: "action", type: "Unknown" });

  expect(PropControlSection.forSelection(state)).toEqual([]);
});

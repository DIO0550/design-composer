import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { treeRowNames } from "@/features/editor/__tests__/tree-rows";
import { EditorState } from "@/features/editor/domains/editor-state";
import { DocumentTree } from "../index";

function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      components: { "primary-button": { type: "Box" } },
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            { name: "title", type: "Text" },
            {
              name: "body",
              type: "Box",
              children: [
                { name: "body-text", type: "Text" },
                { name: "body-action", ref: "primary-button" },
              ],
            },
          ],
        },
      ],
    }),
  );
}

function renderTree(state: EditorState): {
  tree: HTMLElement;
  onSelect: ReturnType<typeof vi.fn>;
} {
  const onSelect = vi.fn();
  const { container } = render(
    <DocumentTree state={state} onSelect={onSelect} onReorder={vi.fn()} />,
  );
  return { tree: container, onSelect };
}

test("artboard の直下のノードがツリーに並ぶ", () => {
  renderTree(setupState());

  expect(screen.getByRole("button", { name: "title" })).toBeDefined();
});

test("入れ子になった孫ノードもツリーに並ぶ", () => {
  renderTree(setupState());

  expect(screen.getByRole("button", { name: "body-text" })).toBeDefined();
});

test("ツリーは artboard・子・孫の順に並ぶ", () => {
  const { tree } = renderTree(setupState());

  expect(treeRowNames(tree)).toEqual([
    "home",
    "title",
    "body",
    "body-text",
    "body-action（primary-button のインスタンス）",
  ]);
});

test("参照ノードはどの部品のインスタンスかが分かる形で並ぶ", () => {
  renderTree(setupState());

  expect(screen.getByText("（primary-button のインスタンス）")).toBeDefined();
});

test("ノードを選ぶとそのノードの名前が選択として伝わる", async () => {
  const { onSelect } = renderTree(setupState());

  await userEvent.click(screen.getByRole("button", { name: "body-text" }));

  expect(onSelect).toHaveBeenCalledWith("body-text");
});

test("選択中のノードは選択状態として示される", () => {
  renderTree(EditorState.select(setupState(), "title"));

  expect(
    screen.getByRole("button", { name: "title" }).getAttribute("aria-current"),
  ).toBe("true");
});

test("artboard が1枚も無いときはその旨が表示される", () => {
  renderTree(EditorState.create(DesignDocument.create({ artboards: [] })));

  expect(screen.getByText("artboard がありません")).toBeDefined();
});

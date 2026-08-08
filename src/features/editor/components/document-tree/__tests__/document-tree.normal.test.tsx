import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { rowNames } from "@/features/editor/__tests__/row-names";
import { EditorState } from "@/features/editor/domains/editor-state";
import { DocumentTree } from "../index";

/**
 * artboard を 2 枚持たせて、ツリーが「今見ている 1 枚」の中身だけを映すことを
 * 見られるようにする。`empty-board` は子を持たない artboard。
 */
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
        {
          name: "settings",
          width: 375,
          height: 812,
          children: [{ name: "settings-title", type: "Text" }],
        },
        { name: "empty-board", width: 375, height: 812, children: [] },
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

test("今見ている artboard の直下のノードがツリーに並ぶ", () => {
  renderTree(setupState());

  expect(screen.getByRole("button", { name: "title" })).toBeDefined();
});

test("入れ子になった孫ノードもツリーに並ぶ", () => {
  renderTree(setupState());

  expect(screen.getByRole("button", { name: "body-text" })).toBeDefined();
});

test("ツリーは子・孫の順に並ぶ", () => {
  const { tree } = renderTree(setupState());

  expect(rowNames(tree)).toEqual(["title", "body", "body-text", "body-action"]);
});

test("artboard 自身はツリーの行に出ない", () => {
  renderTree(setupState());

  expect(screen.queryByRole("button", { name: "home" })).toBeNull();
});

test("別の artboard を選ぶとツリーの中身がその artboard のものに入れ替わる", () => {
  const { tree } = renderTree(EditorState.select(setupState(), "settings"));

  expect(rowNames(tree)).toEqual(["settings-title"]);
});

test("別の artboard の配下のノードを選んでもその artboard の中身が出たままになる", () => {
  const { tree } = renderTree(
    EditorState.select(setupState(), "settings-title"),
  );

  expect(rowNames(tree)).toEqual(["settings-title"]);
});

test("子を持たない artboard を見ているときは行が1つも出ない", () => {
  const { tree } = renderTree(EditorState.select(setupState(), "empty-board"));

  expect(rowNames(tree)).toEqual([]);
});

test("ツリーは今見ている artboard の名前を示す", () => {
  renderTree(EditorState.select(setupState(), "settings"));

  expect(screen.getByText("settings")).toBeDefined();
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

test("artboard が1枚も無いときはツリーが出ない", () => {
  renderTree(EditorState.create(DesignDocument.create({ artboards: [] })));

  expect(screen.queryByRole("region", { name: "ツリー" })).toBeNull();
});

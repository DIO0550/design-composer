import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { treeRowNames } from "@/features/editor/__tests__/tree-rows";
import { EditorState } from "@/features/editor/domains/editor-state";
import { DocumentTree } from "../index";

/**
 * 開閉の場合分けを 1 つの木で見られるようにする。
 * `body` は孫まで持つ枝、`aside` はその兄弟の枝、`title` は子を持たない行、
 * `empty-board` は子を持たない artboard。
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
            {
              name: "body",
              type: "Box",
              children: [
                { name: "body-text", type: "Text" },
                {
                  name: "deep",
                  type: "Box",
                  children: [{ name: "deep-text", type: "Text" }],
                },
              ],
            },
            {
              name: "aside",
              type: "Box",
              children: [{ name: "aside-text", type: "Text" }],
            },
          ],
        },
        { name: "empty-board", width: 375, height: 812, children: [] },
      ],
    }),
  );
}

function renderTree(): {
  tree: HTMLElement;
  onSelect: ReturnType<typeof vi.fn>;
} {
  const onSelect = vi.fn();
  const { container } = render(
    <DocumentTree
      state={setupState()}
      onSelect={onSelect}
      onReorder={vi.fn()}
    />,
  );
  return { tree: container, onSelect };
}

test("開いた直後はすべての枝が開いている", () => {
  const { tree } = renderTree();

  expect(treeRowNames(tree)).toEqual([
    "home",
    "title",
    "body",
    "body-text",
    "deep",
    "deep-text",
    "aside",
    "aside-text",
    "empty-board",
  ]);
});

test("子を持つノードの行には開閉の操作が出る", () => {
  renderTree();

  expect(screen.getByRole("button", { name: "body の開閉" })).toBeDefined();
});

test("子を持たないノードの行には開閉の操作が出ない", () => {
  renderTree();

  expect(screen.queryByRole("button", { name: "title の開閉" })).toBeNull();
});

test("子を持つ artboard の行には開閉の操作が出る", () => {
  renderTree();

  expect(screen.getByRole("button", { name: "home の開閉" })).toBeDefined();
});

test("子を持たない artboard の行には開閉の操作が出ない", () => {
  renderTree();

  expect(
    screen.queryByRole("button", { name: "empty-board の開閉" }),
  ).toBeNull();
});

test("開いている枝の開閉の操作は開いた状態として示される", () => {
  renderTree();

  expect(
    screen.getByRole("button", { name: "body の開閉", expanded: true }),
  ).toBeDefined();
});

test("枝を畳むとその枝の開閉の操作は閉じた状態として示される", async () => {
  renderTree();

  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));

  expect(
    screen.getByRole("button", { name: "body の開閉", expanded: false }),
  ).toBeDefined();
});

test("開いている枝の三角は下向きになる", () => {
  renderTree();

  expect(screen.getByRole("button", { name: "body の開閉" }).textContent).toBe(
    "▾",
  );
});

test("畳んだ枝の三角は右向きになる", async () => {
  renderTree();

  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));

  expect(screen.getByRole("button", { name: "body の開閉" }).textContent).toBe(
    "▸",
  );
});

test("枝を畳むとその枝の子が並びから消える", async () => {
  renderTree();

  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));

  expect(screen.queryByRole("button", { name: "body-text" })).toBeNull();
});

test("枝を畳むとその枝の孫も並びから消える", async () => {
  renderTree();

  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));

  expect(screen.queryByRole("button", { name: "deep-text" })).toBeNull();
});

test("枝を畳むとその枝の子の並べ替えも並びから消える", async () => {
  renderTree();

  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));

  expect(screen.queryByRole("button", { name: "body-text を下へ" })).toBeNull();
});

test("枝を畳んでもその枝自身の行は並びに残る", async () => {
  const { tree } = renderTree();

  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));

  expect(treeRowNames(tree)).toEqual([
    "home",
    "title",
    "body",
    "aside",
    "aside-text",
    "empty-board",
  ]);
});

test("枝を畳んでも兄弟の枝の子は並んだままになる", async () => {
  renderTree();

  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));

  expect(screen.getByRole("button", { name: "aside-text" })).toBeDefined();
});

test("畳んだ枝をもう一度開くと子が並びに戻る", async () => {
  renderTree();

  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));
  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));

  expect(screen.getByRole("button", { name: "body-text" })).toBeDefined();
});

test("枝を畳んでも選択は動かない", async () => {
  const { onSelect } = renderTree();

  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));

  expect(onSelect).not.toHaveBeenCalled();
});

test("畳んだ枝の行を押すとその枝が選択として伝わる", async () => {
  const { onSelect } = renderTree();

  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));
  await userEvent.click(screen.getByRole("button", { name: "body" }));

  expect(onSelect).toHaveBeenCalledWith("body");
});

test("artboard を畳むとその中身が並びから消える", async () => {
  const { tree } = renderTree();

  await userEvent.click(screen.getByRole("button", { name: "home の開閉" }));

  expect(treeRowNames(tree)).toEqual(["home", "empty-board"]);
});

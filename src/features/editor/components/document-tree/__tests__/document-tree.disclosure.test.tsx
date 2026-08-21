import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { DocumentTree } from "../index";

/**
 * 開閉がノードの行に効くことを見られるようにする。
 * `body` は孫まで持つ枝、`title` は子を持たない行。
 *
 * 開閉そのものの場合分け（三角の向き・`aria-expanded`・畳んだ枝の中身）は
 * 行を並べる器（`src/components/nested-row-list`）が持つので、そちらで確かめる。
 * ここに残すのは、器の開閉がドメインの行に届いていることだけ。
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
          ],
        },
      ],
    }),
  );
}

function renderTree(): ReturnType<typeof vi.fn> {
  const onSelect = vi.fn();
  render(
    <DocumentTree
      state={setupState()}
      onSelect={onSelect}
      onReorder={vi.fn()}
    />,
  );
  return onSelect;
}

test("枝を畳むとその枝の子のノードが並びから消える", async () => {
  renderTree();

  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));

  expect(screen.queryByRole("button", { name: "body-text" })).toBeNull();
});

test("畳んだ枝の行を押すとその枝が選択として伝わる", async () => {
  const onSelect = renderTree();

  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));
  await userEvent.click(screen.getByRole("button", { name: "body" }));

  expect(onSelect).toHaveBeenCalledWith("body");
});

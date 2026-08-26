import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import { DocumentTree } from "../index";

/**
 * 開閉がノードの行に届いていることだけを見られるようにする。枝が 1 つあれば足りる。
 *
 * 開閉そのものの場合分け（三角の向き・`aria-expanded`・孫や並べ替えの消え方・
 * 兄弟の枝が残ること）は行を並べる器（`src/components/nested-row-list`）が持つので、
 * そちらで確かめる。ここに場合分けのための木を組むと、見ていない枝が残る。
 */
function setupSelection(): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            {
              name: "body",
              type: "Box",
              children: [{ name: "body-text", type: "Text" }],
            },
          ],
        },
      ],
    }),
    [],
  );
}

function renderTree(): ReturnType<typeof vi.fn> {
  const onSelect = vi.fn();
  render(
    <DocumentTree
      selection={setupSelection()}
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

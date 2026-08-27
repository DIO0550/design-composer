import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { rowNames } from "@/components/__tests__/row-names";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { DocumentTree } from "../index";

/**
 * artboard を 2 枚持たせて、ツリーが「今見ている 1 枚」の中身だけを映すことを
 * 見られるようにする。`empty-board` は子を持たない artboard。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
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
  });
}

function renderTree(selection: DocumentSelection): {
  tree: HTMLElement;
  onSelect: ReturnType<typeof vi.fn>;
} {
  const onSelect = vi.fn();
  const { container } = render(
    <DocumentTree
      selection={selection}
      onSelect={onSelect}
      onReorder={vi.fn()}
    />,
  );
  return { tree: container, onSelect };
}

test("今見ている artboard の直下のノードがツリーに並ぶ", () => {
  renderTree(DocumentSelection.fromNames(setupDocument(), []));

  expect(screen.getByRole("button", { name: "title" })).toBeDefined();
});

test("入れ子になった孫ノードもツリーに並ぶ", () => {
  renderTree(DocumentSelection.fromNames(setupDocument(), []));

  expect(screen.getByRole("button", { name: "body-text" })).toBeDefined();
});

test("ツリーは子・孫の順に並ぶ", () => {
  const { tree } = renderTree(DocumentSelection.fromNames(setupDocument(), []));

  expect(rowNames(tree)).toEqual(["title", "body", "body-text", "body-action"]);
});

test("artboard 自身はツリーの行に出ない", () => {
  renderTree(DocumentSelection.fromNames(setupDocument(), []));

  expect(screen.queryByRole("button", { name: "home" })).toBeNull();
});

test("別の artboard を選ぶとツリーの中身がその artboard のものに入れ替わる", () => {
  const { tree } = renderTree(
    DocumentSelection.fromNames(setupDocument(), ["settings"]),
  );

  expect(rowNames(tree)).toEqual(["settings-title"]);
});

test("別の artboard の配下のノードを選んでもその artboard の中身が出たままになる", () => {
  const { tree } = renderTree(
    DocumentSelection.fromNames(setupDocument(), ["settings-title"]),
  );

  expect(rowNames(tree)).toEqual(["settings-title"]);
});

test("子を持たない artboard を見ているときは行が1つも出ない", () => {
  const { tree } = renderTree(
    DocumentSelection.fromNames(setupDocument(), ["empty-board"]),
  );

  expect(rowNames(tree)).toEqual([]);
});

test("ツリーは今見ている artboard の名前を示す", () => {
  renderTree(DocumentSelection.fromNames(setupDocument(), ["settings"]));

  expect(screen.getByText("settings")).toBeDefined();
});

test("ノードを選ぶとそのノードの名前が選択として伝わる", async () => {
  const { onSelect } = renderTree(
    DocumentSelection.fromNames(setupDocument(), []),
  );

  await userEvent.click(screen.getByRole("button", { name: "body-text" }));

  expect(onSelect).toHaveBeenCalledWith("body-text");
});

test("選択中のノードは選択状態として示される", () => {
  renderTree(DocumentSelection.fromNames(setupDocument(), ["title"]));

  expect(
    screen.getByRole("button", { name: "title" }).getAttribute("aria-current"),
  ).toBe("true");
});

test("artboard が1枚も無いときはツリーが出ない", () => {
  renderTree(
    DocumentSelection.fromNames(DesignDocument.create({ artboards: [] }), []),
  );

  expect(screen.queryByRole("region", { name: "ツリー" })).toBeNull();
});

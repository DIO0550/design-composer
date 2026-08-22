import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import { SelectionState } from "@/domains/selection-state";
import { DocumentTree } from "../index";

/**
 * 型ごとの見え方を 1 枚の artboard で見比べられるようにしたドキュメント。
 * 文言のある Text と無い Text を両方置いて、補助情報の出し分けを確かめる。
 */
function setupSelection(): DocumentSelection {
  return DocumentSelection.create(
    DesignDocument.create({
      components: { "primary-button": { type: "Box" } },
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            { name: "title", type: "Text", props: { content: "サインイン" } },
            { name: "spacer-text", type: "Text" },
            {
              name: "body",
              type: "Box",
              children: [{ name: "body-action", ref: "primary-button" }],
            },
          ],
        },
      ],
    }),
    SelectionState.None,
  );
}

function renderTree(selection: DocumentSelection): void {
  render(
    <DocumentTree
      selection={selection}
      onSelect={vi.fn()}
      onReorder={vi.fn()}
    />,
  );
}

test("Box の行には Box を表す型アイコンが出る", () => {
  renderTree(setupSelection());

  expect(screen.getByText("□")).toBeDefined();
});

test("Text の行には Text を表す型アイコンが出る", () => {
  renderTree(setupSelection());

  expect(screen.getAllByText("T")).toHaveLength(2);
});

test("文言を持つ Text の行にはその文言が引用符付きで出る", () => {
  renderTree(setupSelection());

  expect(screen.getByText('"サインイン"')).toBeDefined();
});

test("文言を持たない Text の行には文言が出ない", () => {
  renderTree(setupSelection());

  expect(screen.queryByText('""')).toBeNull();
});

test("部品インスタンスの行には部品インスタンスを表す型アイコンが出る", () => {
  renderTree(setupSelection());

  expect(screen.getByText("◆")).toBeDefined();
});

test("部品インスタンスの行にはインスタンスであることを表す印が出る", () => {
  renderTree(setupSelection());

  expect(screen.getByText("inst")).toBeDefined();
});

test("スキーマに無い type のノードの行には型アイコンが出ない", () => {
  renderTree(
    DocumentSelection.create(
      DesignDocument.create({
        artboards: [
          {
            name: "home",
            width: 360,
            height: 240,
            children: [{ name: "mystery", type: "Widget" }],
          },
        ],
      }),
      SelectionState.None,
    ),
  );

  expect(screen.getByRole("button", { name: "mystery" }).textContent).toBe(
    "mystery",
  );
});

test("行を指す名前には型アイコンや補助情報が混ざらない", () => {
  renderTree(setupSelection());

  // title は左に型アイコン、右に文言を出す行。名前だけで指せることを確かめる
  expect(screen.getByRole("button", { name: "title" })).toBeDefined();
});

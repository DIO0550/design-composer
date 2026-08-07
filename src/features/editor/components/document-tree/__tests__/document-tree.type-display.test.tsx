import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { DocumentTree } from "../index";

/**
 * 型ごとの見え方を 1 枚の artboard で見比べられるようにしたドキュメント。
 * 文言のある Text と無い Text を両方置いて、補助情報の出し分けを確かめる。
 */
function setupState(): EditorState {
  return EditorState.create(
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
  );
}

function renderTree(state: EditorState): void {
  render(<DocumentTree state={state} onSelect={vi.fn()} onReorder={vi.fn()} />);
}

test("artboard の行には artboard を表す型アイコンが出る", () => {
  renderTree(setupState());

  expect(screen.getByText("▢")).toBeDefined();
});

test("artboard の行には artboard の幅と高さが出る", () => {
  renderTree(setupState());

  expect(screen.getByText("360×240")).toBeDefined();
});

test("Box の行には Box を表す型アイコンが出る", () => {
  renderTree(setupState());

  expect(screen.getByText("□")).toBeDefined();
});

test("Text の行には Text を表す型アイコンが出る", () => {
  renderTree(setupState());

  expect(screen.getAllByText("T")).toHaveLength(2);
});

test("文言を持つ Text の行にはその文言が引用符付きで出る", () => {
  renderTree(setupState());

  expect(screen.getByText('"サインイン"')).toBeDefined();
});

test("文言を持たない Text の行には文言が出ない", () => {
  renderTree(setupState());

  expect(screen.queryByText('""')).toBeNull();
});

test("部品インスタンスの行には部品インスタンスを表す型アイコンが出る", () => {
  renderTree(setupState());

  expect(screen.getByText("◆")).toBeDefined();
});

test("部品インスタンスの行にはインスタンスであることを表す印が出る", () => {
  renderTree(setupState());

  expect(screen.getByText("inst")).toBeDefined();
});

test("スキーマに無い type のノードの行には型アイコンが出ない", () => {
  renderTree(
    EditorState.create(
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
    ),
  );

  expect(screen.getByRole("button", { name: "mystery" }).textContent).toBe(
    "mystery",
  );
});

test("行を指す名前には型アイコンや補助情報が混ざらない", () => {
  renderTree(setupState());

  expect(screen.getByRole("button", { name: "home" })).toBeDefined();
});

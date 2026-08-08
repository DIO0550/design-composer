import { render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import {
  headingOfName,
  rightPaneHeading,
} from "@/features/editor/__tests__/inspector-heading";
import { EditorState } from "@/features/editor/domains/editor-state";
import { TokenEditor } from "../index";

/**
 * 見出しの帯が「どのトークンを編集しているか」を伝えることを見る
 * （UI 案 docs/Design Composer.html の `gray-900` / `Color` / #112）。
 * 5 種すべてのトークンを 1 つのドキュメントに置いて、種別ごとの綴りを見比べる。
 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: {
        colors: { primary: "#3b82f6" },
        spacing: { lg: 24 },
        radius: { md: 8 },
        shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0000001a" } },
        typography: {
          body: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 },
        },
      },
      artboards: [{ name: "home", width: 360, height: 240, children: [] }],
    }),
  );
}

function renderEditor(state: EditorState) {
  render(
    <TokenEditor
      state={state}
      onSetTokenValue={vi.fn()}
      onRenameToken={vi.fn()}
      onRemoveToken={vi.fn()}
    />,
  );
}

test("編集中のトークンの名前が見出しに出る", () => {
  renderEditor(
    EditorState.selectToken(setupState(), { kind: "colors", name: "primary" }),
  );

  expect(headingOfName().textContent).toBe("primary");
});

test("色トークンの種別は Color と出る", () => {
  renderEditor(
    EditorState.selectToken(setupState(), { kind: "colors", name: "primary" }),
  );

  expect(screen.getByText("Color")).toBeDefined();
});

test("余白トークンの種別は Spacing と出る", () => {
  renderEditor(
    EditorState.selectToken(setupState(), { kind: "spacing", name: "lg" }),
  );

  expect(screen.getByText("Spacing")).toBeDefined();
});

test("角丸トークンの種別は Radius と出る", () => {
  renderEditor(
    EditorState.selectToken(setupState(), { kind: "radius", name: "md" }),
  );

  expect(screen.getByText("Radius")).toBeDefined();
});

test("影トークンの種別は Shadow と出る", () => {
  renderEditor(
    EditorState.selectToken(setupState(), { kind: "shadows", name: "sm" }),
  );

  expect(screen.getByText("Shadow")).toBeDefined();
});

test("書体トークンの種別は Typography と出る", () => {
  renderEditor(
    EditorState.selectToken(setupState(), { kind: "typography", name: "body" }),
  );

  expect(screen.getByText("Typography")).toBeDefined();
});

test("トークンを選んでいないときは見出しに名前が出ない", () => {
  renderEditor(setupState());

  /*
   * 帯は残すが中身は出さない。名前の枠だけを残す実装（空の見出し）にすると
   * ここが落ちる。名前が出る側は上のテストが見ている。
   */
  expect(
    within(rightPaneHeading()).queryByRole("heading", { level: 2 }),
  ).toBeNull();
});

test("トークンを選んでいなくても見出しの帯は残る", () => {
  renderEditor(setupState());

  expect(rightPaneHeading()).toBeDefined();
});

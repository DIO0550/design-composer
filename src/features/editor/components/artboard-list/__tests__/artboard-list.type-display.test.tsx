import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { ArtboardList } from "../index";

function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      artboards: [{ name: "home", width: 360, height: 240, children: [] }],
    }),
  );
}

function renderList(): void {
  render(<ArtboardList state={setupState()} onSelect={vi.fn()} />);
}

test("行には artboard を表す型アイコンが出る", () => {
  renderList();

  expect(screen.getByText("#")).toBeDefined();
});

test("行には artboard の幅と高さが出る", () => {
  renderList();

  expect(screen.getByText("360×240")).toBeDefined();
});

test("行を指す名前には型アイコンや大きさが混ざらない", () => {
  renderList();

  expect(screen.getByRole("button", { name: "home" })).toBeDefined();
});

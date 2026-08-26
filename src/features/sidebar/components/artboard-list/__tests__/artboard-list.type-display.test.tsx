import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import { ArtboardList } from "../index";

function setupSelection(): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      artboards: [{ name: "home", width: 360, height: 240, children: [] }],
    }),
    [],
  );
}

function renderList(): void {
  render(
    <ArtboardList
      selection={setupSelection()}
      onSelect={vi.fn()}
      artboardActions={{ add: vi.fn(), reorder: vi.fn() }}
    />,
  );
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

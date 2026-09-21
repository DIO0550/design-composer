import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { LeftPaneViews } from "@/features/sidebar/components/left-pane-rail";
import { LeftPane } from "../index";
import { setupViewContents } from "./view-contents";

test("今いる行き先の中身がパネルに出る", () => {
  render(
    <LeftPane
      view={LeftPaneViews.Assets}
      onSelectView={vi.fn()}
      contents={setupViewContents()}
      isFrozen={false}
    />,
  );

  expect(screen.getByText("パレットの中身")).toBeDefined();
});

test("今いない行き先の中身は出ない", () => {
  render(
    <LeftPane
      view={LeftPaneViews.Assets}
      onSelectView={vi.fn()}
      contents={setupViewContents()}
      isFrozen={false}
    />,
  );

  expect(screen.queryByText("トークンの中身")).toBeNull();
});

test("フッターを持つ行き先ではフッターが出る", () => {
  render(
    <LeftPane
      view={LeftPaneViews.Assets}
      onSelectView={vi.fn()}
      contents={setupViewContents()}
      isFrozen={false}
    />,
  );

  expect(screen.getByText("パレットのフッター")).toBeDefined();
});

test("フッターを持たない行き先では、他の行き先のフッターも出ない", () => {
  render(
    <LeftPane
      view={LeftPaneViews.Tokens}
      onSelectView={vi.fn()}
      contents={setupViewContents()}
      isFrozen={false}
    />,
  );

  expect(screen.queryByText("パレットのフッター")).toBeNull();
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { LeftPaneViews } from "@/features/sidebar/components/left-pane-rail";
import { LeftPane } from "../index";
import { setupViewContents } from "./view-contents";

test("検索欄を持つ中身の行き先では、その案内文の検索欄が出る", () => {
  render(
    <LeftPane
      view={LeftPaneViews.Assets}
      onSelectView={vi.fn()}
      contents={setupViewContents()}
      isFrozen={false}
    />,
  );

  expect(
    screen.getByRole("searchbox", { name: "Search assets" }),
  ).toBeDefined();
});

test("検索欄に打った語が中身へ渡る", async () => {
  render(
    <LeftPane
      view={LeftPaneViews.Layers}
      onSelectView={vi.fn()}
      contents={setupViewContents()}
      isFrozen={false}
    />,
  );

  await userEvent.type(
    screen.getByRole("searchbox", { name: "Search layers" }),
    "home",
  );

  expect(screen.getByText("レイヤーの中身 home")).toBeDefined();
});

test("検索欄を持たない中身の行き先では検索欄が出ない", () => {
  render(
    <LeftPane
      view={LeftPaneViews.Tokens}
      onSelectView={vi.fn()}
      contents={setupViewContents()}
      isFrozen={false}
    />,
  );

  expect(screen.queryByRole("searchbox")).toBeNull();
});

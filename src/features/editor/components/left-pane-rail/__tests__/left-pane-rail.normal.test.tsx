import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { LEFT_PANE_VIEWS, LeftPaneRail } from "../index";

test("レールに3つの行き先がUI案の順で並ぶ", () => {
  render(<LeftPaneRail current={LEFT_PANE_VIEWS.layers} onSelect={() => {}} />);

  expect(
    screen.getAllByRole("button").map((button) => button.textContent),
  ).toEqual(["Layers", "Assets", "Tokens"]);
});

test("今見ている行き先が選択中として示される", () => {
  render(<LeftPaneRail current={LEFT_PANE_VIEWS.assets} onSelect={() => {}} />);

  expect(
    screen.getByRole("button", { name: "Assets" }).getAttribute("aria-current"),
  ).toBe("true");
});

test("見ていない行き先は選択中にならない", () => {
  render(<LeftPaneRail current={LEFT_PANE_VIEWS.assets} onSelect={() => {}} />);

  expect(
    screen.getByRole("button", { name: "Layers" }).getAttribute("aria-current"),
  ).toBe("false");
});

test("別の行き先を押すとその行き先が伝わる", async () => {
  const user = userEvent.setup();
  const selected: string[] = [];
  render(
    <LeftPaneRail
      current={LEFT_PANE_VIEWS.layers}
      onSelect={(view) => selected.push(view)}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Assets" }));

  expect(selected).toEqual(["assets"]);
});

test("今見ている行き先を押してもその行き先が伝わる", async () => {
  const user = userEvent.setup();
  const selected: string[] = [];
  render(
    <LeftPaneRail
      current={LEFT_PANE_VIEWS.layers}
      onSelect={(view) => selected.push(view)}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Layers" }));

  expect(selected).toEqual(["layers"]);
});

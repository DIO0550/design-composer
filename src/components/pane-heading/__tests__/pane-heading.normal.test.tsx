import { render, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { PaneHeading, PaneHeadingTestId } from "../index";

test("渡した中身が帯の中に出る", () => {
  render(
    <PaneHeading>
      <span>home-title</span>
    </PaneHeading>,
  );

  expect(
    within(screen.getByTestId(PaneHeadingTestId)).getByText("home-title"),
  ).toBeDefined();
});

test("中身が空でも帯そのものは残る", () => {
  render(<PaneHeading>{null}</PaneHeading>);

  expect(screen.getByTestId(PaneHeadingTestId)).toBeDefined();
});

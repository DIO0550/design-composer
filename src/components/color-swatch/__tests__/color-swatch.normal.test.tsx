import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { COLOR_SWATCH_TEST_ID, ColorSwatch } from "../index";

test("渡した色で塗られる", () => {
  render(<ColorSwatch color="#3b82f6" />);

  expect(screen.getByTestId(COLOR_SWATCH_TEST_ID).style.backgroundColor).toBe(
    "#3b82f6",
  );
});

test("色は隣の文字が伝えるので読み上げからは外れる", () => {
  render(<ColorSwatch color="#3b82f6" />);

  expect(
    screen.getByTestId(COLOR_SWATCH_TEST_ID).getAttribute("aria-hidden"),
  ).toBe("true");
});

import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ColorSwatch, ColorSwatchTestId } from "../index";

test("渡した色で塗られる", () => {
  render(<ColorSwatch color="#3b82f6" />);

  expect(screen.getByTestId(ColorSwatchTestId).style.backgroundColor).toBe(
    "#3b82f6",
  );
});

test("色は隣の文字が伝えるので読み上げからは外れる", () => {
  render(<ColorSwatch color="#3b82f6" />);

  expect(
    screen.getByTestId(ColorSwatchTestId).getAttribute("aria-hidden"),
  ).toBe("true");
});

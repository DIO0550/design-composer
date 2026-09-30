import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import {
  ColorSwatch,
  ColorSwatchTestId,
  GradientSwatch,
  GradientSwatchTestId,
} from "../index";

const Gradient = "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)";

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

test("階調の見本は渡した階調で塗られる", () => {
  render(<GradientSwatch gradient={Gradient} />);

  expect(screen.getByTestId(GradientSwatchTestId).style.backgroundImage).toBe(
    Gradient,
  );
});

test("階調も隣の文字が伝えるので読み上げからは外れる", () => {
  render(<GradientSwatch gradient={Gradient} />);

  expect(
    screen.getByTestId(GradientSwatchTestId).getAttribute("aria-hidden"),
  ).toBe("true");
});

import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { App } from "../App";

test("アプリを起動するとファイルを開く導線が表示される", () => {
  render(<App />);

  expect(screen.getByRole("button", { name: "開く" })).toBeDefined();
});

test("アプリを起動した直後はドキュメントを開くよう案内される", () => {
  render(<App />);

  expect(
    screen.getByText("ドキュメントを開くか、新しく作成してください。"),
  ).toBeDefined();
});

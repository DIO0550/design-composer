import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { App } from "../App";

test("アプリを起動するとエディタ画面が表示される", () => {
  render(<App />);

  expect(screen.getByRole("main", { name: "キャンバス" })).toBeDefined();
});

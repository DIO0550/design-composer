import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { renderControl } from "./setup";

test("渡した選択肢はすべてセグメントとして出る", () => {
  renderControl([]);

  expect(screen.getAllByRole("button").length).toBe(2);
});

test("ラベルがコントロールの読み上げ名になる", () => {
  renderControl([]);

  expect(screen.getByRole("group", { name: "Direction" })).toBeDefined();
});

test("選ばれているセグメントだけが押された状態で出る", () => {
  renderControl(["row"]);

  expect(screen.getByRole("button", { pressed: true }).textContent).toBe("row");
});

test("セグメントを押すとそのセグメントの選択が通知される", async () => {
  const onSelect = vi.fn();
  renderControl(["column"], onSelect);

  await userEvent.click(screen.getByRole("button", { name: "row" }));

  expect(onSelect).toHaveBeenCalledWith("row");
});

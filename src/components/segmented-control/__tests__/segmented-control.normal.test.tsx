import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { Option } from "@/utils/Option";
import { renderControl } from "./setup";

test("選択肢はすべてセグメントとして出る", () => {
  renderControl(Option.none);

  expect(screen.getAllByRole("button").length).toBe(2);
});

test("ラベルがコントロールの読み上げ名になる", () => {
  renderControl(Option.none);

  expect(screen.getByRole("group", { name: "Direction" })).toBeDefined();
});

test("値を持つときはその値のセグメントが選ばれた状態になる", () => {
  renderControl(Option.some("row"));

  expect(screen.getByRole("button", { pressed: true }).textContent).toBe("row");
});

test("選ばれていないセグメントを押すとその値が通知される", async () => {
  const onChange = vi.fn();
  renderControl(Option.some("column"), onChange);

  await userEvent.click(screen.getByRole("button", { name: "row" }));

  expect(onChange).toHaveBeenCalledWith(Option.some("row"));
});

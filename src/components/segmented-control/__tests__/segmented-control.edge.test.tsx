import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { Option } from "@/utils/Option";
import { renderControl } from "./setup";

test("値を持たないときはどのセグメントも選ばれた状態にならない", () => {
  renderControl(Option.none);

  expect(screen.queryAllByRole("button", { pressed: true }).length).toBe(0);
});

test("選ばれているセグメントをもう一度押すと未選択が通知される", async () => {
  const onChange = vi.fn();
  renderControl(Option.some("row"), onChange);

  await userEvent.click(screen.getByRole("button", { name: "row" }));

  expect(onChange).toHaveBeenCalledWith(Option.none);
});

test("選択肢に無い値を持つときはどのセグメントも選ばれた状態にならない", () => {
  renderControl(Option.some("diagonal"));

  expect(screen.queryAllByRole("button", { pressed: true }).length).toBe(0);
});

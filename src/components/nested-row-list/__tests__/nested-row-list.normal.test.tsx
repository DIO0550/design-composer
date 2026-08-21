import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { NestedRowList } from "../index";
import { renderRowList, rowNames } from "./setup";

test("行の中身は呼び出し側が渡したものがそのまま出る", () => {
  renderRowList();

  expect(screen.getByRole("button", { name: "title" })).toBeDefined();
});

test("行は親の直後にその子が来る順で並ぶ", () => {
  const { list } = renderRowList();

  expect(rowNames(list)).toEqual([
    "title",
    "body",
    "body-text",
    "deep",
    "deep-text",
    "aside",
    "aside-only",
    "footer",
  ]);
});

test("行が1つも無いときは並びの枠が出ない", () => {
  render(<NestedRowList rows={[]} parentName="root" onReorder={vi.fn()} />);

  expect(screen.queryByRole("list")).toBeNull();
});

test("行があるときは並びの枠が出る", () => {
  renderRowList();

  expect(screen.getAllByRole("list")).not.toHaveLength(0);
});

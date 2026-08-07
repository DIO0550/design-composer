import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ComponentList } from "../index";

test("見出しに部品の数が出る", () => {
  render(
    <ComponentList
      refCounts={[
        { name: "card", count: 4 },
        { name: "button", count: 2 },
        { name: "badge", count: 0 },
      ]}
      isInsertEnabled
      onInsert={() => {}}
    />,
  );

  expect(screen.getByText("Components · 3")).toBeDefined();
});

test("部品が無いときは見出しの数が0になる", () => {
  render(<ComponentList refCounts={[]} isInsertEnabled onInsert={() => {}} />);

  expect(screen.getByText("Components · 0")).toBeDefined();
});

test("部品の行にその部品の使用数が出る", () => {
  render(
    <ComponentList
      refCounts={[{ name: "card", count: 4 }]}
      isInsertEnabled
      onInsert={() => {}}
    />,
  );

  expect(screen.getByText("×4")).toBeDefined();
});

test("どこからも使われていない部品の行にも使用数が出る", () => {
  render(
    <ComponentList
      refCounts={[{ name: "card", count: 0 }]}
      isInsertEnabled
      onInsert={() => {}}
    />,
  );

  expect(screen.getByText("×0")).toBeDefined();
});

test("部品は渡された並びのとおりに出る", () => {
  render(
    <ComponentList
      refCounts={[
        { name: "card", count: 0 },
        { name: "button", count: 0 },
        { name: "badge", count: 0 },
      ]}
      isInsertEnabled
      onInsert={() => {}}
    />,
  );

  expect(
    screen.getAllByRole("listitem").map((row) => row.textContent),
  ).toEqual(["◆card×0挿入", "◆button×0挿入", "◆badge×0挿入"]);
});

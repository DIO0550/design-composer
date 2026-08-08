import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { PrimitiveList } from "../index";

test("渡されたプリミティブが行として並ぶ", () => {
  render(<PrimitiveList types={["Box", "Text"]} />);

  expect(
    screen.getAllByRole("listitem").map((item) => item.textContent),
  ).toEqual(["□Box", "TText"]);
});

test("プリミティブの行にはその型を表すアイコンが出る", () => {
  render(<PrimitiveList types={["Box"]} />);

  expect(screen.getByText("□")).toBeDefined();
});

test("渡されたプリミティブが1つも無いときは行が出ない", () => {
  render(<PrimitiveList types={[]} />);

  expect(screen.queryAllByRole("listitem")).toEqual([]);
});

test("渡されたプリミティブが1つも無いときは見出しも出ない", () => {
  render(<PrimitiveList types={[]} />);

  expect(screen.queryByText("Primitives")).toBeNull();
});

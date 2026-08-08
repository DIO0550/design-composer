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

test("渡されたプリミティブが1つも無くても節は残る", () => {
  render(<PrimitiveList types={[]} />);

  // 節ごと消すと `Components` 側と出方が食い違う。0 件であることは
  // 検索語を持つ `AssetsPanel` が伝える。
  expect(screen.getByText("Primitives")).toBeDefined();
});

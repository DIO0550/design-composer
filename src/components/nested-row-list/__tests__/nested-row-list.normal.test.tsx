import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { NestedRowList } from "../index";
import { contentTexts, renderRowList } from "./setup";

test("行の中身は呼び出し側が渡したものがそのまま出る", () => {
  renderRowList();

  expect(screen.getByRole("button", { name: "title" })).toBeDefined();
});

test("行は親の直後にその子が来る順で並ぶ", () => {
  const { list } = renderRowList();

  expect(contentTexts(list)).toEqual([
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

/**
 * その行の字下げ幅（px）。字下げは深さで決まる値なのでインラインスタイルに出る。
 * 行の器自体は役割を持たないので、中身のボタンから 1 段上がって読む。
 *
 * @param name 読みたい行の名前
 * @returns 字下げ幅。スタイルが無ければ `NaN`
 */
function rowPaddingPx(name: string): number {
  const row = screen.getByRole("button", { name }).parentElement;
  return Number.parseFloat(row?.style.paddingInlineStart ?? "");
}

test("深い行ほど字下げが大きくなる", () => {
  renderRowList();

  // title は最上段、deep-text はそこから 2 段下
  expect(rowPaddingPx("deep-text")).toBeGreaterThan(rowPaddingPx("title"));
});

test("同じ深さの行の字下げは揃う", () => {
  renderRowList();

  expect(rowPaddingPx("footer")).toBe(rowPaddingPx("title"));
});

test("行が1つも無いときは並びの枠が出ない", () => {
  render(<NestedRowList rows={[]} parentName="root" onReorder={vi.fn()} />);

  expect(screen.queryByRole("list")).toBeNull();
});

test("行があるときは並びの枠が出る", () => {
  renderRowList();

  expect(screen.getAllByRole("list")).not.toHaveLength(0);
});

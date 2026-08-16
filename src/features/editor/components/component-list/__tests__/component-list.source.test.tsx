import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { ComponentAsset } from "@/domains/component";
import { Option } from "@/utils/Option";
import { ComponentList } from "../index";

/**
 * 選択中のインスタンスの元になっている行の見え方
 * （UI 案 docs/Design Composer.html の `source of selection`）。
 *
 * どの行が出どころかは 2 件以上ないと確かめられないので、どのテストも対照を 1 件置く。
 */
const Assets: readonly ComponentAsset[] = [
  { name: "primary-button", publicPropNames: ["label"], refCount: 4 },
  { name: "card", publicPropNames: ["title", "body"], refCount: 2 },
];

function renderList(sourceName: Option<string>) {
  render(
    <ComponentList
      assets={Assets}
      sourceName={sourceName}
      isInsertEnabled
      onInsert={() => {}}
    />,
  );
}

test("選択中のインスタンスの元になっている行に出どころであることが出る", () => {
  renderList(Option.some("card"));

  const sourceRow = screen.getByText("source of selection").closest("li");

  expect(sourceRow?.textContent).toContain("card");
});

test("出どころではない行には出どころであることが出ない", () => {
  renderList(Option.some("card"));

  expect(screen.getAllByText("source of selection").length).toBe(1);
});

test("インスタンスを選んでいないときはどの行も出どころにならない", () => {
  renderList(Option.none);

  expect(screen.queryByText("source of selection")).toBeNull();
});

test("出どころの行では公開 prop の並びが出どころの知らせに置き換わる", () => {
  /*
   * UI 案は 2 行目を `label`（`Assets` 画面）から `source of selection`
   * （`Assets · Instance` 画面）へ差し替えている。足すのではなく置き換える。
   */
  renderList(Option.some("card"));

  expect(screen.queryByText("title, body")).toBeNull();
});

test("出どころではない行では公開 prop の並びが残る", () => {
  renderList(Option.some("card"));

  expect(screen.getByText("label")).toBeDefined();
});

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { ContextMenu } from "@/components/context-menu";
import { Option } from "@/utils/Option";
import {
  inMenu,
  list,
  menu,
  recordedRow,
  renderMenu,
  row,
  type SelectedRows,
} from "./setup";

/*
 * 行の並び・押したときの呼び出し・割り当ての併記を確かめる
 * （docs/06-ui.md「コンテキストメニュー」）。
 *
 * 色（押せない行の淡色・取り消せない操作の赤）はここでは見ない。class 名を assert すると
 * 実装詳細のテストになるので、確かめる手段は `components/ContextMenu` のストーリーの
 * 視覚差分だけになる。
 */

test("渡した組の順に行が並ぶ", () => {
  renderMenu({
    children: [list(row("Copy"), row("Paste")), list(row("Delete"))],
  });

  expect(
    inMenu()
      .getAllByRole("menuitem")
      .map((item) => item.textContent),
  ).toEqual(["Copy", "Paste", "Delete"]);
});

test("組の数より 1 つ少ない区切りが出る", () => {
  renderMenu({
    children: [
      list(row("Copy"), row("Paste")),
      list(row("Bring forward")),
      list(row("Delete")),
    ],
  });

  expect(inMenu().getAllByRole("separator")).toHaveLength(2);
});

test("行を押すとその行の手続きが呼ばれる", async () => {
  const selected: SelectedRows = [];
  renderMenu({
    children: list(recordedRow("Copy", selected), row("Paste")),
  });

  await userEvent.click(inMenu().getByRole("menuitem", { name: "Copy" }));

  expect(selected).toEqual(["Copy"]);
});

test("押せない行を押しても手続きは呼ばれない", async () => {
  const selected: SelectedRows = [];
  renderMenu({
    children: list(recordedRow("Paste", selected, { isEnabled: false })),
  });

  await userEvent.click(inMenu().getByRole("menuitem", { name: "Paste" }));

  expect(selected).toEqual([]);
});

test("行を実行するとメニューが閉じる", async () => {
  const closed: string[] = [];
  renderMenu({
    children: list(row("Copy")),
    onClose: () => closed.push("closed"),
  });

  await userEvent.click(inMenu().getByRole("menuitem", { name: "Copy" }));

  expect(closed).toEqual(["closed"]);
});

test("割り当てを持つ行にはその綴りが併記される", () => {
  renderMenu({
    children: list(row("Copy", { shortcut: Option.some("⌘C") })),
  });

  expect(inMenu().getByRole("menuitem", { name: "Copy ⌘C" })).toBeDefined();
});

test("割り当てを持たない行では割り当ての欄そのものが出ない", () => {
  renderMenu({
    children: list(
      row("Copy", { shortcut: Option.some("⌘C") }),
      row("Detach instance"),
    ),
  });

  /*
   * 欄が空で出ているのか、欄ごと無いのかを読み分けるために、行の中の要素の数を見る。
   * 読み上げ名（「Detach instance」）だけを見ると、空欄が出ていても通ってしまう。
   */
  const item = inMenu().getByRole("menuitem", { name: "Detach instance" });

  expect(item.childElementCount).toBe(1);
  expect(
    screen.getByRole("menuitem", { name: "Copy ⌘C" }).childElementCount,
  ).toBe(2);
});

test("開いた時点ではどの行にもフォーカスが当たっていない", () => {
  renderMenu({ children: list(row("Copy"), row("Paste")) });

  expect(globalThis.document.activeElement).toBe(menu());
});

/*
 * 組と行は器が型で照合して集める。集めた並びをそのまま描くので、器が知らないものは並ばない
 * （高さだけが合わない状態を作らないため / `placement` が高さの側を見る）。
 */
test("組の中に行でないものを置いても並ばない", () => {
  renderMenu({
    children: (
      <ContextMenu.List>
        <button type="button">行ではないもの</button>
        {row("Copy")}
      </ContextMenu.List>
    ),
  });

  // 器の中に居ないことを見る（器そのものは出ているので、無いのは描かれなかったから）
  expect(inMenu().queryByText("行ではないもの")).toBeNull();
});

test("組でないものを混ぜても区切りは増えない", () => {
  renderMenu({
    children: [
      list(row("Copy")),
      <div key="組ではないもの" />,
      list(row("Delete")),
    ],
  });

  expect(inMenu().getAllByRole("separator")).toHaveLength(1);
});

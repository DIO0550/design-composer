import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import {
  group,
  inMenu,
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
    children: [group(row("Copy"), row("Paste")), group(row("Delete"))],
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
      group(row("Copy"), row("Paste")),
      group(row("Bring forward")),
      group(row("Delete")),
    ],
  });

  expect(inMenu().getAllByRole("separator")).toHaveLength(2);
});

test("行を押すとその行の手続きが呼ばれる", async () => {
  const selected: SelectedRows = [];
  renderMenu({
    children: group(recordedRow("Copy", selected), row("Paste")),
  });

  await userEvent.click(inMenu().getByRole("menuitem", { name: "Copy" }));

  expect(selected).toEqual(["Copy"]);
});

test("押せない行を押しても手続きは呼ばれない", async () => {
  const selected: SelectedRows = [];
  renderMenu({
    children: group(recordedRow("Paste", selected, { isEnabled: false })),
  });

  await userEvent.click(inMenu().getByRole("menuitem", { name: "Paste" }));

  expect(selected).toEqual([]);
});

test("行を実行するとメニューが閉じる", async () => {
  const closed: string[] = [];
  renderMenu({
    children: group(row("Copy")),
    onClose: () => closed.push("closed"),
  });

  await userEvent.click(inMenu().getByRole("menuitem", { name: "Copy" }));

  expect(closed).toEqual(["closed"]);
});

test("割り当てを持つ行にはその綴りが併記される", () => {
  renderMenu({
    children: group(row("Copy", { shortcut: Option.some("⌘C") })),
  });

  expect(inMenu().getByRole("menuitem", { name: "Copy ⌘C" })).toBeDefined();
});

test("割り当てを持たない行では割り当ての欄そのものが出ない", () => {
  renderMenu({
    children: group(
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
  renderMenu({ children: group(row("Copy"), row("Paste")) });

  expect(globalThis.document.activeElement).toBe(menu());
});

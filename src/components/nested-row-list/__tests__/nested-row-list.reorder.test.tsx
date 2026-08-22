import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { renderRowList } from "./setup";

test("行を上へ動かすと同じ親の中の1つ前の位置へ移す指示が伝わる", async () => {
  const { onReorder } = renderRowList();

  await userEvent.click(screen.getByRole("button", { name: "body を上へ" }));

  expect(onReorder).toHaveBeenCalledWith({ parentName: "root", index: 1 }, 0);
});

test("行を下へ動かすと同じ親の中の1つ後ろの位置へ移す指示が伝わる", async () => {
  const { onReorder } = renderRowList();

  await userEvent.click(screen.getByRole("button", { name: "title を下へ" }));

  expect(onReorder).toHaveBeenCalledWith({ parentName: "root", index: 0 }, 1);
});

test("子の行の並べ替えはその親の中の位置として伝わる", async () => {
  const { onReorder } = renderRowList();

  await userEvent.click(screen.getByRole("button", { name: "deep を上へ" }));

  expect(onReorder).toHaveBeenCalledWith({ parentName: "body", index: 1 }, 0);
});

test("並びの先頭の行には上へ動かすボタンが出ない", () => {
  renderRowList();

  expect(screen.queryByRole("button", { name: "title を上へ" })).toBeNull();
});

test("並びの末尾の行には下へ動かすボタンが出ない", () => {
  renderRowList();

  expect(screen.queryByRole("button", { name: "footer を下へ" })).toBeNull();
});

test("兄弟がいない行には並べ替えボタンが出ない", () => {
  renderRowList();

  expect(screen.queryByRole("button", { name: /^aside-only を/ })).toBeNull();
});

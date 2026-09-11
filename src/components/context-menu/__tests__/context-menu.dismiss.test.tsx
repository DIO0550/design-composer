import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { ContextMenu } from "../index";
import { group, menu, row } from "./setup";

/*
 * 外側を押したときに閉じることを確かめる（docs/06-ui.md「コンテキストメニュー」）。
 *
 * 外側の押下だけは `document` で待つので、メニューの外に押せるものを並べて描く。
 */

/**
 * メニューと、その外にある押せるものを並べて描く。
 *
 * @param onClose 閉じる指示を受ける手続き
 */
function renderMenuBesideOutside(onClose: () => void): void {
  render(
    <>
      <button type="button">外側</button>
      <ContextMenu at={{ x: 0, y: 0 }} onClose={onClose}>
        {group(row("Copy"))}
      </ContextMenu>
    </>,
  );
}

test("メニューの外を押すと閉じる", async () => {
  const closed: string[] = [];
  renderMenuBesideOutside(() => closed.push("closed"));

  await userEvent.click(screen.getByRole("button", { name: "外側" }));

  expect(closed).toEqual(["closed"]);
});

test("メニューの余白を押しても閉じない", async () => {
  const closed: string[] = [];
  renderMenuBesideOutside(() => closed.push("closed"));

  // 行ではなく器そのものを押す（行を押すと実行したことで閉じるので、外側かどうかが見えない）
  await userEvent.click(menu());

  expect(closed).toEqual([]);
});

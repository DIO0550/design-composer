import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { openedAt, renderTopBar, SAVE_STATES } from "./setup";

test("親フォルダを持たないパスではファイルの名前だけが出る", () => {
  renderTopBar({ opened: openedAt("app.dcmp") });

  // 区切りごと出ないことまで見たいので、行の中身をそのまま比べる
  expect(
    screen.getByRole("navigation", { name: "ファイルの場所" }).textContent,
  ).toBe("app.dcmp");
});

test("書き込みが拒まれている間は保存に失敗したと出る", () => {
  renderTopBar({ saveState: SAVE_STATES.failed });

  expect(screen.getByText("保存に失敗")).toBeDefined();
});

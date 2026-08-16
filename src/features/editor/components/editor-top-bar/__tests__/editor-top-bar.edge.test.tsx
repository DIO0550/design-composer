import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { openedAt } from "@/features/editor/__tests__/sample-document";
import { renderTopBar, SaveStates } from "./setup";

test("親フォルダを持たないパスではファイルの名前だけが出る", () => {
  renderTopBar({ opened: openedAt("app.dcmp") });

  // 区切りごと出ないことまで見たいので、行の中身をそのまま比べる
  expect(
    screen.getByRole("navigation", { name: "ファイルの場所" }).textContent,
  ).toBe("app.dcmp");
});

test("区切りだけのパスではファイルの名前も親フォルダの名前も出ない", () => {
  renderTopBar({ opened: openedAt("/") });

  expect(
    screen.getByRole("navigation", { name: "ファイルの場所" }).textContent,
  ).toBe("");
});

test("書き込みが拒まれている間は保存に失敗したと出る", () => {
  renderTopBar({ saveState: SaveStates.failed });

  expect(screen.getByText("保存に失敗")).toBeDefined();
});

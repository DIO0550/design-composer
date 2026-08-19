import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { openedAt } from "@/domains/__tests__/sample-document";
import { renderTopBar, SaveStates } from "./setup";

test("開いているファイルの名前が上部バーに出る", () => {
  renderTopBar({ opened: openedAt("/work/settings-ui/app.dcmp") });

  expect(screen.getByText("app.dcmp")).toBeDefined();
});

test("開いているファイルの親フォルダの名前が上部バーに出る", () => {
  renderTopBar({ opened: openedAt("/work/settings-ui/app.dcmp") });

  expect(screen.getByText("settings-ui")).toBeDefined();
});

test("書き出しが終わっているときは保存済みと出る", () => {
  renderTopBar({ saveState: SaveStates.saved });

  expect(screen.getByText("保存済み")).toBeDefined();
});

test("書き出しを待っている間は保存中と出る", () => {
  renderTopBar({ saveState: SaveStates.saving });

  expect(screen.getByText("保存中")).toBeDefined();
});

test("開いた直後の倍率は 100% と出る", () => {
  renderTopBar({ zoom: true });

  expect(screen.getByRole("button", { name: "等倍に戻す" }).textContent).toBe(
    "100%",
  );
});

test("拡大を押すと倍率が上がる", async () => {
  renderTopBar({ zoom: true });

  await userEvent.click(screen.getByRole("button", { name: "拡大" }));

  expect(screen.getByRole("button", { name: "等倍に戻す" }).textContent).toBe(
    "120%",
  );
});

test("縮小を押すと倍率が下がる", async () => {
  renderTopBar({ zoom: true });

  await userEvent.click(screen.getByRole("button", { name: "縮小" }));

  expect(screen.getByRole("button", { name: "等倍に戻す" }).textContent).toBe(
    "83%",
  );
});

test("倍率を押すと等倍に戻る", async () => {
  renderTopBar({ zoom: true });
  await userEvent.click(screen.getByRole("button", { name: "拡大" }));

  await userEvent.click(screen.getByRole("button", { name: "等倍に戻す" }));

  expect(screen.getByRole("button", { name: "等倍に戻す" }).textContent).toBe(
    "100%",
  );
});

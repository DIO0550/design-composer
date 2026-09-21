import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { recordActions, renderDocumentStart } from "./setup";

const Path = "/work/settings-ui/app.dcmp";
const OtherPath = "/work/shop/app.dcmp";

test("開始画面は、支援技術から名前で辿れる", () => {
  renderDocumentStart();

  expect(
    screen.getByRole("region", { name: "ドキュメントの開始" }),
  ).toBeDefined();
});

test("開始画面にはアプリの名前が出る", () => {
  renderDocumentStart();

  expect(
    screen.getByRole("heading", { name: "Design Composer" }),
  ).toBeDefined();
});

test("何も開いていない間は、開くか作るよう案内される", () => {
  renderDocumentStart();

  expect(
    screen.getByText("ドキュメントを開くか、新しく作成してください。"),
  ).toBeDefined();
});

test("何も開いていない間は、開くボタンを押せる", () => {
  renderDocumentStart();

  expect(
    screen.getByRole("button", { name: "開く" }).hasAttribute("disabled"),
  ).toBe(false);
});

test("何も開いていない間は、新規作成ボタンも押せる", () => {
  renderDocumentStart();

  expect(
    screen.getByRole("button", { name: "新規作成" }).hasAttribute("disabled"),
  ).toBe(false);
});

test("開くボタンを押すと、開く操作が始まる", async () => {
  const recorded = recordActions();
  renderDocumentStart({ actions: recorded.actions });

  await userEvent.click(screen.getByRole("button", { name: "開く" }));

  expect(recorded.openCount()).toBe(1);
});

test("最近使ったファイルは、ファイル名で並ぶ", () => {
  renderDocumentStart({ recentPaths: [Path] });

  const recents = screen.getByRole("navigation", {
    name: "最近使ったファイル",
  });
  expect(within(recents).getByText("app.dcmp")).toBeDefined();
});

/*
 * 同じファイル名を別フォルダで 2 つ置く。ファイル名しか出さない実装だと、どちらを
 * 指しているのか読めないまま通ってしまう。
 */
test("最近使ったファイルには、収めているフォルダの名前も並ぶ", () => {
  renderDocumentStart({ recentPaths: [Path, OtherPath] });

  const recents = screen.getByRole("navigation", {
    name: "最近使ったファイル",
  });
  expect(within(recents).getByText("settings-ui")).toBeDefined();
  expect(within(recents).getByText("shop")).toBeDefined();
});

/*
 * 同名のファイルを別フォルダで開いたときに区別できるよう、フルパスを title に載せる
 * （帯のパンくずと同じ約束）。フォルダ名だけでは足りない例（3 階層目が同名）で見る。
 */
test("最近使ったファイルには、フルパスが title に載る", () => {
  renderDocumentStart({ recentPaths: [Path] });

  const recents = screen.getByRole("navigation", {
    name: "最近使ったファイル",
  });
  expect(within(recents).getByTitle(Path)).toBeDefined();
});

test("最近使ったファイルを押すと、そのパスが開かれる", async () => {
  const recorded = recordActions();
  renderDocumentStart({ recentPaths: [Path], actions: recorded.actions });

  const recents = screen.getByRole("navigation", {
    name: "最近使ったファイル",
  });
  await userEvent.click(within(recents).getByRole("button"));

  expect(recorded.openedPaths).toStrictEqual([Path]);
});

test("ウィンドウへ落として開けることが案内される", () => {
  renderDocumentStart();

  expect(
    screen.getByText(".dcmp ファイルをウィンドウに落としても開けます"),
  ).toBeDefined();
});

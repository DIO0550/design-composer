import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import {
  breakFileExternally,
  canvasPane,
  fixFileExternally,
  leftPane,
  propertyPane,
  renderOpenedDocument,
  selectInTree,
  zoomToolbar,
} from "./setup";

/*
 * 外部編集でファイルが壊れたときに、表示がファイルと食い違っていることが画面へ出るか
 * （#135）。凍結は上部バー・左ペイン・キャンバス・右ペインへ同時に効くので、
 * 配線ごと確かめられるのはここだけ（部品単体のストーリーには相手のペインが居ない）。
 *
 * 「操作を受け付けない」は `inert` で作っているが、**happy-dom は `inert` を強制しない**
 * （属性は付くが click は届く）。押せないこと自体はブラウザでしか確かめられないので、
 * ここでは属性が付くところまでを見る。
 */

test("外部変更でファイルが壊れると、映っているのが最後に正常だった表示だとキャンバスに出る", async () => {
  const fake = await renderOpenedDocument();

  await breakFileExternally(fake);

  expect(within(canvasPane()).getByText("最後に正常だった表示")).toBeDefined();
});

test("ファイルが壊れていなければ、最後に正常だった表示とは名乗らない", async () => {
  await renderOpenedDocument();

  expect(screen.queryByText("最後に正常だった表示")).toBeNull();
});

test("ファイルが壊れると、左ペインが操作を受け付けなくなる", async () => {
  const fake = await renderOpenedDocument();

  await breakFileExternally(fake);

  expect(leftPane().hasAttribute("inert")).toBe(true);
});

test("ファイルが壊れると、左ペインの見出しが凍結中を名乗る", async () => {
  const fake = await renderOpenedDocument();

  await breakFileExternally(fake);

  expect(within(leftPane()).getByText("凍結中")).toBeDefined();
});

test("ファイルが壊れると、キャンバスの中身が操作を受け付けなくなる", async () => {
  const fake = await renderOpenedDocument();

  await breakFileExternally(fake);

  expect(screen.getByTestId("canvas-content").hasAttribute("inert")).toBe(true);
});

test("ファイルが壊れると、選んでいたノードのプロパティを編集できなくなる", async () => {
  const fake = await renderOpenedDocument();
  await selectInTree("home-title");
  // 壊す前は編集できることを対照に置く（欄が最初から無い実装でも通ってしまうため）
  expect(
    within(propertyPane()).getByRole("button", { name: "選択を解除" }),
  ).toBeDefined();

  await breakFileExternally(fake);

  expect(
    within(propertyPane()).queryByRole("button", { name: "選択を解除" }),
  ).toBeNull();
  expect(within(propertyPane()).getByText("選択は凍結中")).toBeDefined();
});

test("ファイルが壊れても、右ペインの見出しは選んでいたものを保つ", async () => {
  const fake = await renderOpenedDocument();
  await selectInTree("home-title");

  await breakFileExternally(fake);

  expect(
    within(screen.getByTestId("right-pane-heading")).getByText("home-title"),
  ).toBeDefined();
});

test("ファイルが壊れると、上部バーが保存状態ではなくエラーの件数を出す", async () => {
  const fake = await renderOpenedDocument();

  await breakFileExternally(fake);

  expect(screen.getByText(/件のエラー · ファイルが不正/)).toBeDefined();
  // 出た側だけを見ると、保存状態を残したまま足した実装でも通ってしまう
  expect(screen.queryByText("保存済み")).toBeNull();
});

test("凍結中も倍率は操作できる", async () => {
  const fake = await renderOpenedDocument();
  await breakFileExternally(fake);

  await userEvent.click(
    within(zoomToolbar()).getByRole("button", { name: "拡大" }),
  );

  expect(
    screen.getByTestId("canvas-content").getAttribute("style") ?? "",
  ).toContain("scale(1.2)");
});

test("ファイルが直ると凍結が解けて通常表示に戻る", async () => {
  const fake = await renderOpenedDocument();
  await breakFileExternally(fake);

  await fixFileExternally(fake);

  expect(screen.queryByText("最後に正常だった表示")).toBeNull();
  expect(leftPane().hasAttribute("inert")).toBe(false);
});

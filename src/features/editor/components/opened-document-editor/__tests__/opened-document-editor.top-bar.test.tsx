import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { dragRowNamed } from "@/components/__tests__/row-drag";
import { canvasPane, renderOpenedDocument, tree, zoomToolbar } from "./setup";

/** キャンバスの中身に効いている変形（ズームの結果）。 */
function canvasTransform(): string {
  return screen.getByTestId("canvas-content").getAttribute("style") ?? "";
}

test("開いているファイルの名前が上部バーに出る", async () => {
  await renderOpenedDocument();

  expect(screen.getByText("sample.dcmp")).toBeDefined();
});

test("開いているファイルの親フォルダの名前が上部バーに出る", async () => {
  await renderOpenedDocument();

  expect(screen.getByText("work")).toBeDefined();
});

test("上部バーで拡大するとキャンバスの中身が拡大される", async () => {
  await renderOpenedDocument();

  await userEvent.click(
    within(zoomToolbar()).getByRole("button", { name: "拡大" }),
  );

  expect(canvasTransform()).toContain("scale(1.2)");
});

test("倍率の操作はキャンバスではなく上部バーにある", async () => {
  await renderOpenedDocument();

  // 上部バー側を対照に置く。キャンバス側だけを見ると、操作が丸ごと消えても通る
  expect(
    within(zoomToolbar()).getByRole("button", { name: "拡大" }),
  ).toBeDefined();
  expect(
    within(canvasPane()).queryByRole("button", { name: "拡大" }),
  ).toBeNull();
});

test("編集すると上部バーが保存中になる", async () => {
  await renderOpenedDocument();

  dragRowNamed(tree(), { from: "home-title", to: "home-login" });

  expect(screen.getByText("保存中")).toBeDefined();
});

test("編集がファイルへ書き出されると上部バーが保存中でなくなる", async () => {
  await renderOpenedDocument();
  dragRowNamed(tree(), { from: "home-title", to: "home-login" });

  await screen.findByText("保存済み");

  /*
   * 「保存中が消えた」を見る。開いた直後も「保存済み」なので、出ている側だけを見ると
   * 保存状態を 1 つに潰した実装でも通ってしまう（rules/testing.md）。
   */
  expect(screen.queryByText("保存中")).toBeNull();
});

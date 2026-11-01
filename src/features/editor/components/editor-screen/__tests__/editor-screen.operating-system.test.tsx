import { fireEvent, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { contextMenu } from "@/components/__tests__/context-menu";
import { SampleDocument } from "@/features/editor/__tests__/sample-document";
import { DialogChoice } from "@/libs/document-dialog/fake";
import { DocumentJson } from "@/libs/document-json";
import type { NavigatorPlatform } from "@/libs/operating-system";
import { MacOsNavigator, WindowsNavigator } from "@/libs/operating-system/fake";
import { Path, renderEditorScreen, startOpen, tree } from "./setup";

/*
 * 画面の入口で受け取った OS が、開いたドキュメントのコンテキストメニューまで届くかを見る
 * （docs/06-ui.md「コンテキストメニュー」）。綴りの規則そのものは編集画面の層のテストが見る。
 */

/**
 * その OS で動いていることにして `Path` を開き、ツリーの `home-title` の行を右クリックする。
 *
 * @param platform アプリが動いている webview の `navigator`
 * @returns 開いたメニューの Copy の行
 */
async function copyRowOn(platform: NavigatorPlatform): Promise<HTMLElement> {
  const observer = renderEditorScreen(
    { [Path]: DocumentJson.serialize(SampleDocument) },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
    { platform },
  );
  await startOpen(observer);

  fireEvent.contextMenu(
    within(tree()).getByRole("button", { name: "home-title" }),
    { clientX: 120, clientY: 80 },
  );

  return within(contextMenu()).getByRole("menuitem", { name: /^Copy/ });
}

test("Windows で動いている画面でドキュメントを開くと、ツリーの行のメニューの Copy に Ctrl+C が併記される", async () => {
  const copyRow = await copyRowOn(WindowsNavigator);

  expect(copyRow.textContent).toContain("Ctrl+C");
});

test("macOS で動いている画面でドキュメントを開くと、ツリーの行のメニューの Copy に ⌘C が併記される", async () => {
  const copyRow = await copyRowOn(MacOsNavigator);

  expect(copyRow.textContent).toContain("⌘C");
});

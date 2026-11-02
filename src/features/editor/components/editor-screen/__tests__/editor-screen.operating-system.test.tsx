import { expect, test } from "vitest";
import {
  menuRow,
  rightClickInTree,
} from "@/features/editor/__tests__/editor-context-menu";
import { SampleDocument } from "@/features/editor/__tests__/sample-document";
import { DialogChoice } from "@/libs/document-dialog/fake";
import { DocumentJson } from "@/libs/document-json";
import type { NavigatorPlatform } from "@/libs/operating-system";
import {
  MacOsNavigatorPlatform,
  WindowsNavigatorPlatform,
} from "@/libs/operating-system/fake";
import { Path, renderEditorScreen, startOpen } from "./setup";

/*
 * 画面の入口で受け取った OS が、開いたドキュメントのコンテキストメニューまで届くかを見る
 * （docs/06-ui.md「コンテキストメニュー」）。綴りの規則そのものは編集画面の層のテストが見る。
 */

/**
 * その OS で動いていることにして `Path` を開き、ツリーの `home-title` の行を右クリックする。
 *
 * @param navigatorPlatform アプリが動いている webview の `navigator`
 * @returns 開いたメニューの Copy の行
 */
async function copyRowOn(
  navigatorPlatform: NavigatorPlatform,
): Promise<HTMLElement> {
  const observer = renderEditorScreen(
    { [Path]: DocumentJson.serialize(SampleDocument) },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
    { navigatorPlatform },
  );
  await startOpen(observer);

  rightClickInTree("home-title");

  return menuRow("Copy");
}

test("Windows で動いている画面でドキュメントを開くと、ツリーの行のメニューの Copy に Ctrl+C が併記される", async () => {
  const copyRow = await copyRowOn(WindowsNavigatorPlatform);

  expect(copyRow.textContent).toContain("Ctrl+C");
});

test("macOS で動いている画面でドキュメントを開くと、ツリーの行のメニューの Copy に ⌘C が併記される", async () => {
  const copyRow = await copyRowOn(MacOsNavigatorPlatform);

  expect(copyRow.textContent).toContain("⌘C");
});

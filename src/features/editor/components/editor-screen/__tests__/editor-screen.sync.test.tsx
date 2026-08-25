import { screen, waitFor, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { dragRow } from "@/components/__tests__/pointer-gesture";
import { rowNames } from "@/components/__tests__/row-names";
import { artboardContent } from "@/domains/__tests__/sample-document";
import { SampleDocument } from "@/features/editor/__tests__/sample-document";
import { DialogChoice } from "@/libs/document-dialog/fake";
import { DocumentJson } from "@/libs/document-json";
import { Option } from "@/utils/Option";
import {
  changeExternally,
  clickCreate,
  clickOpen,
  OtherPath,
  Path,
  renderEditorScreen,
} from "./setup";

function tree(): HTMLElement {
  return screen.getByRole("region", { name: "ツリー" });
}

function artboardList(): HTMLElement {
  return screen.getByRole("region", { name: "artboard 一覧" });
}

/**
 * ツリーの行を掴んで別の行の上まで運ぶ。編集を 1 つ起こす手段として使う
 * （何の編集かはこのテストの関心ではない）。
 *
 * @param movement 掴む行と運ぶ先の行の名前
 */
function reorderInTree(movement: Readonly<{ from: string; to: string }>): void {
  const tree = screen.getByRole("region", { name: "ツリー" });
  const from = within(tree).getByRole("button", {
    name: movement.from,
  }).parentElement;
  const to = within(tree).getByRole("button", {
    name: movement.to,
  }).parentElement;
  const group = from?.closest("ul");
  if (from === null || to === null || !group) {
    throw new Error("ツリーの行が見つからない");
  }
  dragRow({ from, to, group });
}

test("編集した内容が自動保存され、開き直すとその状態が読み戻る", async () => {
  const opened = DocumentJson.serialize(SampleDocument);
  const files = renderEditorScreen(
    { [Path]: opened },
    { open: DialogChoice.chosen(Path), save: DialogChoice.chosen(OtherPath) },
  );
  await clickOpen();

  reorderInTree({ from: "home-title", to: "home-login" });
  await waitFor(
    () => {
      expect(files.contentOf(Path)).not.toStrictEqual(Option.some(opened));
    },
    { timeout: 3000 },
  );
  // 別のファイルへ移ってから開き直す。同じファイルを続けて開いても
  // 画面は作り直されないため、ファイルから読み戻したことにならない。
  await clickCreate();
  await clickOpen();

  expect(rowNames(tree())).toEqual(["home-login", "home-title"]);
});

test("開いているファイルが外部から書き換わると、その内容が画面に反映される", async () => {
  const files = renderEditorScreen(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );
  await clickOpen();

  await changeExternally(files, Path, artboardContent("profile"));

  expect(
    within(artboardList()).getByRole("button", { name: "profile" }),
  ).toBeDefined();
});

test("別のファイルを開くと、前に開いていたファイルの監視が止まる", async () => {
  const files = renderEditorScreen(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.chosen(OtherPath) },
  );
  await clickOpen();

  await clickCreate();

  expect(files.isWatching(Path)).toBe(false);
});

test("別のファイルを開くと、そのファイルの監視が始まる", async () => {
  const files = renderEditorScreen(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.chosen(OtherPath) },
  );
  await clickOpen();

  await clickCreate();

  expect(files.isWatching(OtherPath)).toBe(true);
});

test("別のファイルを開いた後は、前のファイルが書き換わっても画面は変わらない", async () => {
  const files = renderEditorScreen(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.chosen(OtherPath) },
  );
  await clickOpen();
  await clickCreate();

  await changeExternally(files, Path, artboardContent("profile"));

  expect(screen.queryByRole("button", { name: "profile" })).toBeNull();
});

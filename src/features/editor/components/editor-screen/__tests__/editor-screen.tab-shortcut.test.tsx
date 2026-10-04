import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { artboardContent } from "@/domains/__tests__/sample-document";
import { SampleDocument } from "@/features/editor/__tests__/sample-document";
import { AppMenuCommands } from "@/libs/app-menu";
import { DialogChoice } from "@/libs/document-dialog/fake";
import { DocumentJson } from "@/libs/document-json";
import {
  dragTab,
  OtherPath,
  openTwo,
  Path,
  renderEditorScreen,
  selectTab,
  startOpen,
  tabBar,
} from "./setup";

/**
 * 上端の帯が、そのパスのドキュメントを見ていることを示しているか。
 *
 * @param path 見ているはずのドキュメントのパス
 * @returns 見えている編集画面の帯にそのパスが出ていれば `true`
 */
function isViewing(path: string): boolean {
  return within(screen.getByRole("banner")).queryByTitle(path) !== null;
}

test("⌘ と数字を押すと、左から数えてその番号のタブへ移る", async () => {
  await openTwo();

  await userEvent.keyboard("{Meta>}[Digit1]{/Meta}");

  expect(isViewing(Path)).toBe(true);
});

/** 9 つ並べるときの、`Path` の後ろに並ぶ 8 つのパス。 */
const LaterPaths = Array.from(
  { length: 8 },
  (_, index) => `/work/page-${index + 2}.dcmp`,
);

/*
 * 2 つ並べるだけでは ⌘1 と ⌘2 しか確かめられず、⌘3〜⌘9 の割り当てが抜けても落ちない。
 * 先頭のタブを見ている状態から押すので、どの番号も見ている先を変える。
 */
test.each(
  LaterPaths.map((path, index) => ({ digit: index + 2, path })),
)("⌘$digit を押すと、左から $digit 番目のタブへ移る", async ({
  digit,
  path,
}) => {
  const observer = renderEditorScreen(
    {
      [Path]: DocumentJson.serialize(SampleDocument),
      ...Object.fromEntries(
        LaterPaths.map((later) => [later, artboardContent(later)]),
      ),
    },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );
  await startOpen(observer);
  await observer.dropFiles(LaterPaths);
  await selectTab(Path);

  await userEvent.keyboard(`{Meta>}[Digit${digit}]{/Meta}`);

  expect(isViewing(path)).toBe(true);
});

test("並んでいる数より大きい番号を押しても、見ているタブは変わらない", async () => {
  await openTwo();
  await selectTab(Path);

  await userEvent.keyboard("{Meta>}[Digit9]{/Meta}");

  expect(isViewing(Path)).toBe(true);
});

test("タブを並べ替えた後は、並べ替えた後の左から数える", async () => {
  await openTwo();
  await dragTab({ from: "settings.dcmp", to: "login.dcmp" });

  await userEvent.keyboard("{Meta>}[Digit2]{/Meta}");

  expect(isViewing(Path)).toBe(true);
});

test("Shift も押していると、⌘ と数字でタブを移らない", async () => {
  await openTwo();

  await userEvent.keyboard("{Shift>}{Meta>}[Digit1]{/Meta}{/Shift}");

  expect(isViewing(OtherPath)).toBe(true);
});

test("文字を打っている間は、⌘ と数字でタブを移らない", async () => {
  await openTwo();
  await userEvent.click(
    screen.getByRole("searchbox", { name: "Search layers" }),
  );

  await userEvent.keyboard("{Meta>}[Digit1]{/Meta}");

  expect(isViewing(OtherPath)).toBe(true);
});

test("メニューのタブを閉じるを選ぶと、見ているタブが閉じて後ろのタブへ移る", async () => {
  const observer = await openTwo();
  await selectTab(Path);

  await observer.chooseMenu(AppMenuCommands.CloseTab);

  expect(within(tabBar()).queryByTitle(Path)).toBeNull();
  expect(isViewing(OtherPath)).toBe(true);
});

test("最後のタブでメニューのタブを閉じるを選ぶと、開始画面へ戻る", async () => {
  const observer = renderEditorScreen(
    { [Path]: DocumentJson.serialize(SampleDocument) },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );
  await startOpen(observer);

  await observer.chooseMenu(AppMenuCommands.CloseTab);

  expect(
    screen.getByText("ドキュメントを開くか、新しく作成してください。"),
  ).toBeDefined();
});

/*
 * 開く操作に取り違えていれば、ダイアログが `Path` を選んで開くので開始画面から外れる。
 * 開始画面でウィンドウを閉じるのは #996。
 */
test("開始画面でメニューのタブを閉じるを選んでも、開始画面のまま", async () => {
  const observer = renderEditorScreen(
    { [Path]: DocumentJson.serialize(SampleDocument) },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );

  await observer.chooseMenu(AppMenuCommands.CloseTab);

  expect(
    screen.getByText("ドキュメントを開くか、新しく作成してください。"),
  ).toBeDefined();
});

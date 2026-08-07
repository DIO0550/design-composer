import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import {
  artboardContent,
  SAMPLE_DOCUMENT,
} from "@/features/editor/__tests__/sample-document";
import { treeRowNames } from "@/features/editor/__tests__/tree-rows";
import { DialogChoice } from "@/libs/document-dialog/fake";
import { DocumentJson } from "@/libs/document-json";
import { Option } from "@/utils/Option";
import {
  changeExternally,
  clickCreate,
  clickOpen,
  OTHER_PATH,
  PATH,
  renderEditorScreen,
} from "./setup";

function tree(): HTMLElement {
  return screen.getByRole("region", { name: "ツリー" });
}

test("編集した内容が自動保存され、開き直すとその状態が読み戻る", async () => {
  const opened = DocumentJson.serialize(SAMPLE_DOCUMENT);
  const files = renderEditorScreen(
    { [PATH]: opened },
    { open: DialogChoice.chosen(PATH), save: DialogChoice.chosen(OTHER_PATH) },
  );
  await clickOpen();

  await userEvent.click(
    screen.getByRole("button", { name: "home-title を下へ" }),
  );
  await waitFor(
    () => {
      expect(files.contentOf(PATH)).not.toStrictEqual(Option.some(opened));
    },
    { timeout: 3000 },
  );
  // 別のファイルへ移ってから開き直す。同じファイルを続けて開いても
  // 画面は作り直されないため、ファイルから読み戻したことにならない。
  await clickCreate();
  await clickOpen();

  expect(treeRowNames(tree()).slice(1, 3)).toEqual([
    "home-login（primary-button のインスタンス）",
    "home-title",
  ]);
});

test("戻した内容も自動保存され、開き直すと戻したあとの状態が読み戻る", async () => {
  const opened = DocumentJson.serialize(SAMPLE_DOCUMENT);
  const files = renderEditorScreen(
    { [PATH]: opened },
    { open: DialogChoice.chosen(PATH), save: DialogChoice.chosen(OTHER_PATH) },
  );
  await clickOpen();
  await userEvent.click(
    screen.getByRole("button", { name: "home-title を下へ" }),
  );
  // 並べ替えがファイルへ載るまで待つ。載る前に戻すと中身が変わらないため、
  // 「戻した内容が保存された」ことを見たことにならない。
  await waitFor(
    () => {
      expect(files.contentOf(PATH)).not.toStrictEqual(Option.some(opened));
    },
    { timeout: 3000 },
  );

  await userEvent.keyboard("{Control>}z{/Control}");
  await waitFor(
    () => {
      expect(files.contentOf(PATH)).toStrictEqual(Option.some(opened));
    },
    { timeout: 3000 },
  );
  await clickCreate();
  await clickOpen();

  expect(treeRowNames(tree()).slice(1, 3)).toEqual([
    "home-title",
    "home-login（primary-button のインスタンス）",
  ]);
});

test("開いているファイルが外部から書き換わると、その内容が画面に反映される", async () => {
  const files = renderEditorScreen(
    { [PATH]: artboardContent("home") },
    { open: DialogChoice.chosen(PATH), save: DialogChoice.CANCELED },
  );
  await clickOpen();

  await changeExternally(files, PATH, artboardContent("profile"));

  expect(within(tree()).getByRole("button", { name: "profile" })).toBeDefined();
});

test("別のファイルを開くと、前に開いていたファイルの監視が止まる", async () => {
  const files = renderEditorScreen(
    { [PATH]: artboardContent("home") },
    { open: DialogChoice.chosen(PATH), save: DialogChoice.chosen(OTHER_PATH) },
  );
  await clickOpen();

  await clickCreate();

  expect(files.isWatching(PATH)).toBe(false);
});

test("別のファイルを開くと、そのファイルの監視が始まる", async () => {
  const files = renderEditorScreen(
    { [PATH]: artboardContent("home") },
    { open: DialogChoice.chosen(PATH), save: DialogChoice.chosen(OTHER_PATH) },
  );
  await clickOpen();

  await clickCreate();

  expect(files.isWatching(OTHER_PATH)).toBe(true);
});

test("別のファイルを開いた後は、前のファイルが書き換わっても画面は変わらない", async () => {
  const files = renderEditorScreen(
    { [PATH]: artboardContent("home") },
    { open: DialogChoice.chosen(PATH), save: DialogChoice.chosen(OTHER_PATH) },
  );
  await clickOpen();
  await clickCreate();

  await changeExternally(files, PATH, artboardContent("profile"));

  expect(screen.queryByRole("button", { name: "profile" })).toBeNull();
});

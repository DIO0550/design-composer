import { screen, waitFor, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { dragRowNamed } from "@/components/__tests__/row-drag";
import { rowNames } from "@/components/__tests__/row-names";
import { artboardContent } from "@/domains/__tests__/sample-document";
import { SampleDocument } from "@/features/editor/__tests__/sample-document";
import { DialogChoice } from "@/libs/document-dialog/fake";
import { DocumentJson } from "@/libs/document-json";
import { Option } from "@/utils/Option";
import {
  artboardList,
  changeExternally,
  closeTab,
  OtherPath,
  Path,
  renderEditorScreen,
  selectTab,
  startCreate,
  startOpen,
  tree,
} from "./setup";

test("編集した内容が自動保存され、開き直すとその状態が読み戻る", async () => {
  const opened = DocumentJson.serialize(SampleDocument);
  const observer = renderEditorScreen(
    { [Path]: opened },
    { open: DialogChoice.chosen(Path), save: DialogChoice.chosen(OtherPath) },
  );
  await startOpen(observer);

  dragRowNamed(screen.getByRole("region", { name: "ツリー" }), {
    from: "home-title",
    to: "home-login",
  });
  await waitFor(
    () => {
      expect(observer.files.contentOf(Path)).not.toStrictEqual(
        Option.some(opened),
      );
    },
    { timeout: 3000 },
  );
  // いったん閉じてから開き直す。開いたままのタブへ移るだけでは画面が作り直されず、
  // ファイルから読み戻したことにならない。
  await closeTab(Path);
  await startOpen(observer);

  expect(rowNames(tree())).toEqual(["home-login", "home-title"]);
});

test("開いているファイルが外部から書き換わると、その内容が画面に反映される", async () => {
  const observer = renderEditorScreen(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );
  await startOpen(observer);

  await changeExternally(observer.files, Path, artboardContent("profile"));

  expect(
    within(artboardList()).getByRole("button", { name: "profile" }),
  ).toBeDefined();
});

test("別のファイルを開いても、前に開いたファイルの監視は続く", async () => {
  const observer = renderEditorScreen(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.chosen(OtherPath) },
  );
  await startOpen(observer);

  await startCreate(observer);

  expect(observer.files.isWatching(Path)).toBe(true);
});

test("タブを閉じると、そのファイルの監視が止まる", async () => {
  const observer = renderEditorScreen(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.chosen(OtherPath) },
  );
  await startOpen(observer);
  await startCreate(observer);

  await closeTab(Path);

  expect(observer.files.isWatching(Path)).toBe(false);
});

test("別のファイルを開くと、そのファイルの監視が始まる", async () => {
  const observer = renderEditorScreen(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.chosen(OtherPath) },
  );
  await startOpen(observer);

  await startCreate(observer);

  expect(observer.files.isWatching(OtherPath)).toBe(true);
});

test("背面のタブのファイルが書き換わっても、見ている画面は変わらない", async () => {
  const observer = renderEditorScreen(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.chosen(OtherPath) },
  );
  await startOpen(observer);
  await startCreate(observer);

  await changeExternally(observer.files, Path, artboardContent("profile"));

  // 見ているのは新規作成した側。artboard 一覧を引いてから、届いていないことを見る
  // （画面全体から探すと、背面のタブに隠れているだけでも null になる）。
  expect(
    within(artboardList()).queryByRole("button", { name: "profile" }),
  ).toBeNull();
});

test("背面のタブのファイルが書き換わると、そのタブへ移ったとき取り込まれている", async () => {
  const observer = renderEditorScreen(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.chosen(OtherPath) },
  );
  await startOpen(observer);
  await startCreate(observer);

  await changeExternally(observer.files, Path, artboardContent("profile"));
  await selectTab(Path);

  expect(
    within(artboardList()).getByRole("button", { name: "profile" }),
  ).toBeDefined();
});

/*
 * 背面になったタブの書き出し待ちが生きていること。背面を描くのをやめると cleanup で
 * デバウンスのタイマーが消え、編集した内容がファイルへ届かないまま失われる。
 */
test("背面になったタブで編集した内容も、戻らずにファイルへ書き出される", async () => {
  const opened = DocumentJson.serialize(SampleDocument);
  const observer = renderEditorScreen(
    { [Path]: opened, [OtherPath]: artboardContent("settings") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );
  await startOpen(observer);

  dragRowNamed(tree(), { from: "home-title", to: "home-login" });
  await observer.dropFiles([OtherPath]);

  await waitFor(
    () => {
      expect(observer.files.contentOf(Path)).not.toStrictEqual(
        Option.some(opened),
      );
    },
    { timeout: 3000 },
  );
});

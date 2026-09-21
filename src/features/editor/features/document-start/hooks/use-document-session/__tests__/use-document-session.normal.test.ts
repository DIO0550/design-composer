import { expect, test } from "vitest";
import { artboardContent } from "@/domains/__tests__/sample-document";
import { OpenedDocument } from "@/domains/session/opened-document";
import { DocumentSession } from "@/features/editor/features/document-start/domains/document-session";
import { DialogChoice } from "@/libs/document-dialog/fake";
import { DocumentJson } from "@/libs/document-json";
import { Option } from "@/utils/Option";
import {
  NewPath,
  OtherPath,
  openedPaths,
  Path,
  renderDocumentSession,
} from "./setup";

test("ダイアログで選んだファイルが開かれる", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );

  await observer.openDocument();

  expect(openedPaths(observer.session())).toStrictEqual([Path]);
});

test("2 つ目を開いても、1 つ目は開いたまま残る", async () => {
  const observer = renderDocumentSession(
    {
      [Path]: artboardContent("home"),
      [OtherPath]: artboardContent("settings"),
    },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );
  await observer.openDocument();

  await observer.dropFiles([OtherPath]);

  expect(openedPaths(observer.session())).toStrictEqual([Path, OtherPath]);
  expect(DocumentSession.activePath(observer.session())).toStrictEqual(
    Option.some(OtherPath),
  );
});

test("既に開いているファイルを開き直すと、増やさずにそちらへ移る", async () => {
  const observer = renderDocumentSession(
    {
      [Path]: artboardContent("home"),
      [OtherPath]: artboardContent("settings"),
    },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );
  await observer.openDocument();
  await observer.dropFiles([OtherPath]);

  await observer.dropFiles([Path]);

  expect(openedPaths(observer.session())).toStrictEqual([Path, OtherPath]);
  expect(DocumentSession.activePath(observer.session())).toStrictEqual(
    Option.some(Path),
  );
});

test("開いているドキュメントの間を行き来できる", async () => {
  const observer = renderDocumentSession(
    {
      [Path]: artboardContent("home"),
      [OtherPath]: artboardContent("settings"),
    },
    { open: DialogChoice.Canceled, save: DialogChoice.Canceled },
  );
  await observer.dropFiles([Path, OtherPath]);

  await observer.activateTab(Path);

  expect(DocumentSession.activePath(observer.session())).toStrictEqual(
    Option.some(Path),
  );
});

test("タブを閉じると、そのドキュメントだけが並びから消える", async () => {
  const observer = renderDocumentSession(
    {
      [Path]: artboardContent("home"),
      [OtherPath]: artboardContent("settings"),
    },
    { open: DialogChoice.Canceled, save: DialogChoice.Canceled },
  );
  await observer.dropFiles([Path, OtherPath]);

  await observer.closeTab(Path);

  expect(openedPaths(observer.session())).toStrictEqual([OtherPath]);
});

test("最後のタブを閉じると、何も開いていない状態へ戻る", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.Canceled, save: DialogChoice.Canceled },
  );
  await observer.dropFiles([Path]);

  await observer.closeTab(Path);

  expect(DocumentSession.activePath(observer.session())).toStrictEqual(
    Option.none,
  );
});

test("新規作成すると、選んだ保存先に雛形のドキュメントが書き出される", async () => {
  const observer = renderDocumentSession(
    {},
    { open: DialogChoice.Canceled, save: DialogChoice.chosen(NewPath) },
  );

  await observer.createDocument();

  expect(observer.files.contentOf(NewPath)).toStrictEqual(
    Option.some(
      DocumentJson.serialize(
        OpenedDocument.createFromTemplate(NewPath).document,
      ),
    ),
  );
});

test("新規作成したドキュメントはそのまま開かれる", async () => {
  const observer = renderDocumentSession(
    {},
    { open: DialogChoice.Canceled, save: DialogChoice.chosen(NewPath) },
  );

  await observer.createDocument();

  expect(openedPaths(observer.session())).toStrictEqual([NewPath]);
});

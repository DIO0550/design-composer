import { expect, test } from "vitest";
import { artboardContent } from "@/domains/__tests__/sample-document";
import { DocumentSession } from "@/features/document-start/domains/document-session";
import { DialogChoice } from "@/libs/document-dialog/fake";
import { Option } from "@/utils/Option";
import {
  NewPath,
  Path,
  renderDocumentSession,
  storedRecentPaths,
} from "./setup";

/** 既に一覧に載っているもう 1 つのファイル。 */
const OtherPath = "/work/shop/app.dcmp";

test("ダイアログで開いたファイルが一覧の先頭に来る", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
    { storedAppState: storedRecentPaths([OtherPath]) },
  );
  await observer.settle();

  await observer.openDocument();

  expect(observer.recentPaths()).toStrictEqual([Path, OtherPath]);
});

test("開いたファイルを載せた一覧が書き出される", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
    { storedAppState: storedRecentPaths([OtherPath]) },
  );
  await observer.settle();

  await observer.openDocument();

  expect(observer.appState.storedContent()).toStrictEqual(
    Option.some(storedRecentPaths([Path, OtherPath])),
  );
});

test("新規作成したファイルも一覧の先頭に来る", async () => {
  const observer = renderDocumentSession(
    {},
    { open: DialogChoice.Canceled, save: DialogChoice.chosen(NewPath) },
    { storedAppState: storedRecentPaths([OtherPath]) },
  );
  await observer.settle();

  await observer.createDocument();

  expect(observer.recentPaths()).toStrictEqual([NewPath, OtherPath]);
});

test("ドロップで開いたファイルも一覧の先頭に来る", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.Canceled, save: DialogChoice.Canceled },
    { storedAppState: storedRecentPaths([OtherPath]) },
  );

  await observer.dropFiles([Path]);

  expect(observer.recentPaths()).toStrictEqual([Path, OtherPath]);
});

test("同じファイルを開き直しても一覧は増えない", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
    { storedAppState: storedRecentPaths([OtherPath, Path]) },
  );
  await observer.settle();

  await observer.openDocument();

  expect(observer.recentPaths()).toStrictEqual([Path, OtherPath]);
});

test("開けなかったファイルは一覧に載らない", async () => {
  const observer = renderDocumentSession(
    {},
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
    { storedAppState: storedRecentPaths([OtherPath]) },
  );
  await observer.settle();

  await observer.openDocument();

  expect(observer.recentPaths()).toStrictEqual([OtherPath]);
});

test("一覧を書き出せなくてもファイルは開かれる", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
    { denyAppStateSave: true },
  );
  await observer.settle();

  await observer.openDocument();

  expect(DocumentSession.activePath(observer.session())).toStrictEqual(
    Option.some(Path),
  );
});

test("一覧を書き出せなくても、開いたファイルは一覧の先頭に来る", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
    { denyAppStateSave: true },
  );
  await observer.settle();

  await observer.openDocument();

  expect(observer.recentPaths()).toStrictEqual([Path]);
});

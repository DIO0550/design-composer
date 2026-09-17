import { expect, test } from "vitest";
import { artboardContent } from "@/domains/__tests__/sample-document";
import { DocumentSession } from "@/features/document-start/domains/document-session";
import { CommandSources } from "@/features/document-start/hooks/use-document-session";
import { AppMenuCommands } from "@/libs/app-menu";
import { DialogChoice } from "@/libs/document-dialog/fake";
import { Option } from "@/utils/Option";
import {
  NewPath,
  OtherPath,
  openedPaths,
  Path,
  renderDocumentSession,
} from "./setup";

test("メニューから開くと、ダイアログで選んだファイルが開かれる", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );

  await observer.chooseMenu(AppMenuCommands.Open);

  expect(DocumentSession.activePath(observer.session())).toStrictEqual(
    Option.some(Path),
  );
});

test("メニューから新規作成すると、選んだ保存先にドキュメントが作られる", async () => {
  const observer = renderDocumentSession(
    {},
    { open: DialogChoice.Canceled, save: DialogChoice.chosen(NewPath) },
  );

  await observer.chooseMenu(AppMenuCommands.Create);

  expect(Option.isSome(observer.files.contentOf(NewPath))).toBe(true);
});

/*
 * 開くダイアログは「選ばずに閉じた」ことにしてある。ダイアログを経由する実装に
 * 変わると何も開かれなくなるので、この 1 件で経路の違いまで捕まえられる。
 */
test("ファイルを落とすと、ダイアログを出さずにそのファイルが開かれる", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.Canceled, save: DialogChoice.Canceled },
  );

  await observer.dropFiles([Path]);

  expect(DocumentSession.activePath(observer.session())).toStrictEqual(
    Option.some(Path),
  );
});

test("複数のファイルを落とすと、落とした数だけ開かれる", async () => {
  const observer = renderDocumentSession(
    {
      [Path]: artboardContent("home"),
      [OtherPath]: artboardContent("settings"),
    },
    { open: DialogChoice.Canceled, save: DialogChoice.Canceled },
  );

  await observer.dropFiles([Path, OtherPath]);

  expect(openedPaths(observer.session())).toStrictEqual([Path, OtherPath]);
});

test("落としたファイルのうち、既に開いているものは増えない", async () => {
  const observer = renderDocumentSession(
    {
      [Path]: artboardContent("home"),
      [OtherPath]: artboardContent("settings"),
    },
    { open: DialogChoice.Canceled, save: DialogChoice.Canceled },
  );
  await observer.dropFiles([Path]);

  await observer.dropFiles([Path, OtherPath]);

  expect(openedPaths(observer.session())).toStrictEqual([Path, OtherPath]);
});

test("開いた後に別のファイルを落とすと、そちらを見ている状態になる", async () => {
  const observer = renderDocumentSession(
    {
      [Path]: artboardContent("home"),
      [OtherPath]: artboardContent("settings"),
    },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );
  await observer.openDocument();

  await observer.dropFiles([OtherPath]);

  expect(DocumentSession.activePath(observer.session())).toStrictEqual(
    Option.some(OtherPath),
  );
});

test("解釈できないファイルを落とすと、開けない理由が残る", async () => {
  const observer = renderDocumentSession(
    { [Path]: '{ "formatVersion": ' },
    { open: DialogChoice.Canceled, save: DialogChoice.Canceled },
  );

  await observer.dropFiles([Path]);

  expect(Option.isSome(DocumentSession.failure(observer.session()))).toBe(true);
});

test("メニューの購読を張れないと、メニューの経路の失敗が残る", async () => {
  const observer = renderDocumentSession(
    {},
    { open: DialogChoice.Canceled, save: DialogChoice.Canceled },
    { denyMenu: true },
  );

  await observer.settle();

  const failure = observer.commandFailure();
  expect(Option.isSome(failure) && failure.value.source).toBe(
    CommandSources.Menu,
  );
});

test("ドロップの購読を張れないと、ドロップの経路の失敗が残る", async () => {
  const observer = renderDocumentSession(
    {},
    { open: DialogChoice.Canceled, save: DialogChoice.Canceled },
    { denyDrop: true },
  );

  await observer.settle();

  const failure = observer.commandFailure();
  expect(Option.isSome(failure) && failure.value.source).toBe(
    CommandSources.Drop,
  );
});

test("購読が張れていれば、受け取れない理由は残らない", async () => {
  const observer = renderDocumentSession(
    {},
    { open: DialogChoice.Canceled, save: DialogChoice.Canceled },
  );

  await observer.settle();

  expect(observer.commandFailure()).toStrictEqual(Option.none);
});

/*
 * 新規作成の書き込みを止めて `Opening` に留めたまま別のファイルを落とす。ガードが
 * 無いと、落としたファイルはその場で開かれ、開始画面が読み込み中から別のドキュメントへ
 * すり替わる。書き込みを解く前に見るのは、解いたあとは新規作成の完了で NewPath に
 * 収束して差が消えるため（解放前なら「まだ Opening」か「Path が開いた」かで割れる）。
 */
test("開く操作の最中に落とされた指示は捨てられる", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.Canceled, save: DialogChoice.chosen(NewPath) },
  );
  const release = observer.files.holdWrites(NewPath);
  await observer.createDocument();

  await observer.dropFiles([Path]);

  // 落とした Path は開かれず、新規作成の読み込み中のまま。
  expect(DocumentSession.isOpening(observer.session())).toBe(true);
  release();
});

/*
 * 2 つとも読めないファイルを落とす。どちらの失敗もパスを原文に持つので、
 * 「最初の失敗を残す」を後ろのものと取り違えると落ちる。
 */
test("複数が読めなかったときは、最初の失敗が残る", async () => {
  const observer = renderDocumentSession(
    {},
    { open: DialogChoice.Canceled, save: DialogChoice.Canceled },
  );

  await observer.dropFiles([Path, OtherPath]);

  expect(DocumentSession.failure(observer.session())).toStrictEqual(
    Option.some({
      kind: "io",
      error: { reason: "missing", message: `${Path}: ファイルが存在しない` },
    }),
  );
});

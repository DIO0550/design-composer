import { expect, test } from "vitest";
import { artboardContent } from "@/domains/__tests__/sample-document";
import { DocumentAccessFailure } from "@/domains/session/document-access-failure";
import { DocumentSession } from "@/features/document-start/domains/document-session";
import { DialogChoice } from "@/libs/document-dialog/fake";
import { Option } from "@/utils/Option";
import { Path, renderDocumentSession, storedRecentPaths } from "./setup";

/** 開かない選択だけを並べたダイアログ。復元は利用者の操作を挟まない。 */
const NoDialogChoices = {
  open: DialogChoice.Canceled,
  save: DialogChoice.Canceled,
};

/** 一覧の 2 番目に置く、開けるファイル。先頭だけが開くことを確かめるために使う。 */
const SecondPath = "/work/shop/app.dcmp";

test("保存された一覧の先頭のファイルが起動時に開かれる", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home"), [SecondPath]: artboardContent("shop") },
    NoDialogChoices,
    { storedAppState: storedRecentPaths([Path, SecondPath]) },
  );

  await observer.settle();

  expect(DocumentSession.openedPath(observer.session())).toStrictEqual(
    Option.some(Path),
  );
});

test("保存された一覧が起動時にそのまま並ぶ", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home"), [SecondPath]: artboardContent("shop") },
    NoDialogChoices,
    { storedAppState: storedRecentPaths([Path, SecondPath]) },
  );

  await observer.settle();

  expect(observer.recentPaths()).toStrictEqual([Path, SecondPath]);
});

test("前回開いていたファイルが消えていたら理由を持つ失敗になる", async () => {
  const observer = renderDocumentSession(
    { [SecondPath]: artboardContent("shop") },
    NoDialogChoices,
    { storedAppState: storedRecentPaths([Path, SecondPath]) },
  );

  await observer.settle();

  expect(observer.session()).toStrictEqual(
    DocumentSession.failed({
      kind: "io",
      error: DocumentAccessFailure.create(
        "missing",
        `${Path}: ファイルが存在しない`,
      ),
    }),
  );
});

test("前回開いていたファイルが開けなくても一覧から外れない", async () => {
  const observer = renderDocumentSession(
    { [SecondPath]: artboardContent("shop") },
    NoDialogChoices,
    { storedAppState: storedRecentPaths([Path, SecondPath]) },
  );

  await observer.settle();

  expect(observer.recentPaths()).toStrictEqual([Path, SecondPath]);
});

test("一覧が 1 件も無ければ何も開かない", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    NoDialogChoices,
    { storedAppState: storedRecentPaths([]) },
  );

  await observer.settle();

  expect(observer.session()).toStrictEqual(DocumentSession.Closed);
});

test("まだ一度も保存していなければ何も開かない", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    NoDialogChoices,
  );

  await observer.settle();

  expect(observer.session()).toStrictEqual(DocumentSession.Closed);
});

/*
 * 保存されている並びを、読み込み時に畳まれる形（同じパスが 2 回）にしてある。
 * 復元が一覧を書き出すと畳まれた並びで上書きされるので、書き出した瞬間に落ちる。
 */
test("復元では一覧を書き出さない", async () => {
  const stored = storedRecentPaths([Path, SecondPath, Path]);
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home"), [SecondPath]: artboardContent("shop") },
    NoDialogChoices,
    { storedAppState: stored },
  );

  await observer.settle();

  expect(observer.appState.storedContent()).toStrictEqual(Option.some(stored));
});

test("保存された一覧を読み取れなければ空の一覧から始まる", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    NoDialogChoices,
    { storedAppState: storedRecentPaths([Path]), denyAppStateLoad: true },
  );

  await observer.settle();

  expect(observer.recentPaths()).toStrictEqual([]);
});

test("保存された一覧を読み取れなければ、その理由が残る", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    NoDialogChoices,
    { storedAppState: storedRecentPaths([Path]), denyAppStateLoad: true },
  );

  await observer.settle();

  expect(observer.recentFilesFailure()).toStrictEqual(
    Option.some("app-state.json: 読み込みが拒まれた"),
  );
});

test("保存された一覧を解釈できなければ、その理由が残る", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    NoDialogChoices,
    { storedAppState: '{"recentPaths":"/work/login.dcmp"}' },
  );

  await observer.settle();

  expect(Option.isSome(observer.recentFilesFailure())).toBe(true);
});

test("保存された一覧を解釈できなければ何も開かない", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    NoDialogChoices,
    { storedAppState: '{"recentPaths":"/work/login.dcmp"}' },
  );

  await observer.settle();

  expect(observer.session()).toStrictEqual(DocumentSession.Closed);
});

test("読み取れた一覧には理由が残らない", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    NoDialogChoices,
    { storedAppState: storedRecentPaths([SecondPath]) },
  );

  await observer.settle();

  expect(observer.recentFilesFailure()).toStrictEqual(Option.none);
});

test("解釈できなかった一覧は、次に開いたファイルで書き直される", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
    { storedAppState: '{"recentPaths":"/work/login.dcmp"}' },
  );
  await observer.settle();

  await observer.openDocument();

  expect(observer.appState.storedContent()).toStrictEqual(
    Option.some(storedRecentPaths([Path])),
  );
});

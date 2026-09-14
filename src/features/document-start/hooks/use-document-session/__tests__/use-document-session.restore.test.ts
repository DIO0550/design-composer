import { expect, test } from "vitest";
import { artboardContent } from "@/domains/__tests__/sample-document";
import { DocumentAccessFailure } from "@/domains/session/document-access-failure";
import { DocumentSession } from "@/features/document-start/domains/document-session";
import { AppStateJson } from "@/libs/app-state-json";
import { DialogChoice } from "@/libs/document-dialog/fake";
import { Option } from "@/utils/Option";
import { Path, renderDocumentSession } from "./setup";

/** 開かない選択だけを並べたダイアログ。復元は利用者の操作を挟まない。 */
const NoDialogChoices = {
  open: DialogChoice.Canceled,
  save: DialogChoice.Canceled,
};

/** 一覧の 2 番目に置く、開けるファイル。先頭だけが開くことを確かめるために使う。 */
const SecondPath = "/work/shop/app.dcmp";

/**
 * 保存されているアプリ自身の状態のテキストを組み立てる。
 *
 * @param recentPaths 保存されている一覧（新しい順）
 * @returns `app-state.json` に置かれているテキスト
 */
function storedState(recentPaths: readonly string[]): string {
  return AppStateJson.serialize({ recentPaths });
}

test("保存された一覧の先頭のファイルが起動時に開かれる", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home"), [SecondPath]: artboardContent("shop") },
    NoDialogChoices,
    { storedAppState: storedState([Path, SecondPath]) },
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
    { storedAppState: storedState([Path, SecondPath]) },
  );

  await observer.settle();

  expect(observer.recentPaths()).toStrictEqual([Path, SecondPath]);
});

test("前回開いていたファイルが消えていたら理由を持つ失敗になる", async () => {
  const observer = renderDocumentSession(
    { [SecondPath]: artboardContent("shop") },
    NoDialogChoices,
    { storedAppState: storedState([Path, SecondPath]) },
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
    { storedAppState: storedState([Path, SecondPath]) },
  );

  await observer.settle();

  expect(observer.recentPaths()).toStrictEqual([Path, SecondPath]);
});

test("一覧が 1 件も無ければ何も開かない", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    NoDialogChoices,
    { storedAppState: storedState([]) },
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

test("保存された一覧を解釈できなければ何も開かない", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    NoDialogChoices,
    { storedAppState: '{"recentPaths":"/work/login.dcmp"}' },
  );

  await observer.settle();

  expect(observer.session()).toStrictEqual(DocumentSession.Closed);
});

test("保存された一覧を解釈できなくても、保存されている中身は書き換えない", async () => {
  const broken = '{"recentPaths":"/work/login.dcmp"}';
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    NoDialogChoices,
    { storedAppState: broken },
  );

  await observer.settle();

  expect(observer.appState.storedContent()).toStrictEqual(Option.some(broken));
});

test("保存された一覧を読めなくても、保存されている中身は書き換えない", async () => {
  const stored = storedState([Path]);
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    NoDialogChoices,
    { storedAppState: stored, denyAppStateLoad: true },
  );

  await observer.settle();

  expect(observer.appState.storedContent()).toStrictEqual(Option.some(stored));
});

test("復元で開いたファイルは、保存されている一覧をそのまま残す", async () => {
  const stored = storedState([Path, SecondPath]);
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home"), [SecondPath]: artboardContent("shop") },
    NoDialogChoices,
    { storedAppState: stored },
  );

  await observer.settle();

  expect(observer.appState.storedContent()).toStrictEqual(Option.some(stored));
});

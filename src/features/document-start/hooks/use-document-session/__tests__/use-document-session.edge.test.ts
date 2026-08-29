import { expect, test } from "vitest";
import {
  artboardContent,
  danglingTokenContent,
  danglingTokenDocument,
} from "@/domains/__tests__/sample-document";
import { DocumentSession } from "@/features/document-start/domains/document-session";
import { DialogChoice } from "@/libs/document-dialog/fake";
import { Option } from "@/utils/Option";
import { NewPath, Path, renderDocumentSession } from "./setup";

test("ファイルを選ばずにダイアログを閉じると、何も開かれない", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.Canceled, save: DialogChoice.Canceled },
  );

  await observer.openDocument();

  expect(observer.session()).toStrictEqual(DocumentSession.Closed);
});

test("開いている最中にダイアログを閉じても、開いていたドキュメントはそのまま残る", async () => {
  const observer = renderDocumentSession(
    {},
    { open: DialogChoice.Canceled, save: DialogChoice.chosen(NewPath) },
  );
  await observer.createDocument();

  await observer.openDocument();

  expect(DocumentSession.openedPath(observer.session())).toStrictEqual(
    Option.some(NewPath),
  );
});

test("読み込めないファイルを選ぶと、その失敗が残る", async () => {
  const observer = renderDocumentSession(
    {},
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );

  await observer.openDocument();

  expect(observer.session()).toStrictEqual(
    DocumentSession.failed({
      kind: "io",
      error: { reason: "missing", message: `${Path}: ファイルが存在しない` },
    }),
  );
});

test("新規作成の保存先へ書けないときは、その失敗が残る", async () => {
  const observer = renderDocumentSession(
    {},
    { open: DialogChoice.Canceled, save: DialogChoice.chosen(NewPath) },
  );
  observer.files.denyWrites(NewPath);

  await observer.createDocument();

  expect(observer.session()).toStrictEqual(
    DocumentSession.failed({
      kind: "io",
      error: {
        reason: "notPermitted",
        message: `${NewPath}: 書き込みが拒まれた`,
      },
    }),
  );
});

test("解釈できないファイルを選ぶと、エラー一覧が残る", async () => {
  const observer = renderDocumentSession(
    { [Path]: '{ "formatVersion": ' },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );

  await observer.openDocument();

  expect(observer.session()).toStrictEqual(
    DocumentSession.failed({
      kind: "unparsable",
      errors: [
        {
          kind: "syntax-error",
          message: expect.any(String),
          location: { kind: "text-position", position: expect.any(Number) },
        },
      ],
    }),
  );
});

/*
 * 自動保存が書き出した不正なドキュメントを開き直せること（#158）。置いてある内容は
 * 自動保存が書くのと同じ綴り（`danglingTokenContent`）なので、往復がここで閉じる。
 */
test("スキーマ検証にだけ落ちるファイルを選ぶと、そのまま開いた状態になる", async () => {
  const observer = renderDocumentSession(
    { [Path]: danglingTokenContent("home") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );

  await observer.openDocument();

  // JSON を経由すると省略可能なキーが落ちるため、キーの有無ではなく値で比べる。
  expect(observer.session()).toEqual(
    DocumentSession.opened({
      path: Path,
      document: danglingTokenDocument("home"),
    }),
  );
});

test("ダイアログを出せなかったときは、その失敗が残る", async () => {
  const observer = renderDocumentSession(
    {},
    {
      open: DialogChoice.failed("dialog.open not allowed"),
      save: DialogChoice.Canceled,
    },
  );

  await observer.openDocument();

  expect(observer.session()).toStrictEqual(
    DocumentSession.failed({
      kind: "dialog",
      error: { message: "Error: dialog.open not allowed" },
    }),
  );
});

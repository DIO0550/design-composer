import { expect, test } from "vitest";
import { artboardContent } from "@/domains/__tests__/sample-document";
import { DocumentSession } from "@/features/editor/domains/document-session";
import { DialogChoice } from "@/libs/document-dialog/fake";
import { Option } from "@/utils/Option";
import { Path, renderDocumentSession } from "./setup";

const NewPath = "/work/untitled.dcmp";

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
      error: { kind: "notFound", message: `${Path}: ファイルが存在しない` },
    }),
  );
});

test("内容が不正なファイルを選ぶと、エラー一覧が残る", async () => {
  const observer = renderDocumentSession(
    { [Path]: '{ "formatVersion": ' },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );

  await observer.openDocument();

  expect(observer.session()).toStrictEqual(
    DocumentSession.failed({
      kind: "invalid",
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

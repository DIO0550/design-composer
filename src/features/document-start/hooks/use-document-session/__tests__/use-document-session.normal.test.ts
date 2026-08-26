import { expect, test } from "vitest";
import {
  artboardContent,
  artboardDocument,
} from "@/domains/__tests__/sample-document";
import { OpenedDocument } from "@/domains/session/opened-document";
import { DocumentSession } from "@/features/document-start/domains/document-session";
import { DialogChoice } from "@/libs/document-dialog/fake";
import { DocumentJson } from "@/libs/document-json";
import { Option } from "@/utils/Option";
import { NewPath, Path, renderDocumentSession } from "./setup";

test("ダイアログで選んだファイルが開かれる", async () => {
  const observer = renderDocumentSession(
    { [Path]: artboardContent("home") },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );

  await observer.openDocument();

  // JSON を経由すると省略可能なキーが落ちるため、キーの有無ではなく値で比べる。
  expect(observer.session()).toEqual(
    DocumentSession.opened({ path: Path, document: artboardDocument("home") }),
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

  expect(DocumentSession.openedPath(observer.session())).toStrictEqual(
    Option.some(NewPath),
  );
});

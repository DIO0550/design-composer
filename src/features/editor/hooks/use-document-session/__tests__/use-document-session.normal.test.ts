import { expect, test } from "vitest";
import {
  artboardContent,
  artboardDocument,
} from "@/features/editor/__tests__/sample-document";
import { DocumentSession } from "@/features/editor/domains/document-session";
import { OpenedDocument } from "@/features/editor/domains/opened-document";
import { DialogChoice } from "@/libs/document-dialog/fake";
import { DocumentJson } from "@/libs/document-json";
import { Option } from "@/utils/Option";
import { PATH, renderDocumentSession } from "./setup";

const NEW_PATH = "/work/untitled.dcmp";

test("ダイアログで選んだファイルが開かれる", async () => {
  const observer = renderDocumentSession(
    { [PATH]: artboardContent("home") },
    { open: DialogChoice.chosen(PATH), save: DialogChoice.CANCELED },
  );

  await observer.openDocument();

  // JSON を経由すると省略可能なキーが落ちるため、キーの有無ではなく値で比べる。
  expect(observer.session()).toEqual(
    DocumentSession.opened({ path: PATH, document: artboardDocument("home") }),
  );
});

test("新規作成すると、選んだ保存先に雛形のドキュメントが書き出される", async () => {
  const observer = renderDocumentSession(
    {},
    { open: DialogChoice.CANCELED, save: DialogChoice.chosen(NEW_PATH) },
  );

  await observer.createDocument();

  expect(observer.files.contentOf(NEW_PATH)).toStrictEqual(
    Option.some(
      DocumentJson.serialize(
        OpenedDocument.createFromTemplate(NEW_PATH).document,
      ),
    ),
  );
});

test("新規作成したドキュメントはそのまま開かれる", async () => {
  const observer = renderDocumentSession(
    {},
    { open: DialogChoice.CANCELED, save: DialogChoice.chosen(NEW_PATH) },
  );

  await observer.createDocument();

  expect(DocumentSession.openedPath(observer.session())).toStrictEqual(
    Option.some(NEW_PATH),
  );
});

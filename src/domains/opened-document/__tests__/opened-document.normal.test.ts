import { expect, test } from "vitest";
import {
  artboardContent,
  artboardDocument,
} from "@/domains/__tests__/sample-document";
import { DocumentTemplate } from "@/domains/design-document";
import { DocumentJson } from "@/libs/document-json";
import { Result } from "@/utils/Result";
import { OpenedDocument } from "../index";

const Path = "/work/login.dcmp";

test("読み込んだ内容が正しければ、そのドキュメントを開いた状態になる", () => {
  const opened = OpenedDocument.fromParsed(
    Path,
    DocumentJson.parse(artboardContent("home")),
  );

  // JSON を経由すると省略可能なキーが落ちるため、キーの有無ではなく値で比べる。
  expect(Result.unwrap(opened)).toEqual({
    path: Path,
    document: artboardDocument("home"),
  });
});

test("新規作成したドキュメントには既定のトークンが入っている", () => {
  const created = OpenedDocument.createFromTemplate(Path);

  expect(created.document.tokens).toStrictEqual(
    DocumentTemplate.Default.tokens,
  );
});

test("新規作成したドキュメントには初期の部品セットが入っている", () => {
  const created = OpenedDocument.createFromTemplate(Path);

  expect(created.document.components).toStrictEqual(
    DocumentTemplate.Default.components,
  );
});

test("新規作成したドキュメントは選んだ保存先を持つ", () => {
  const created = OpenedDocument.createFromTemplate(Path);

  expect(created.path).toBe(Path);
});

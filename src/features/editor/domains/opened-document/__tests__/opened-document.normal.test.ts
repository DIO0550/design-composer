import { expect, test } from "vitest";
import { DocumentTemplate } from "@/domains/design-document";
import {
  artboardContent,
  artboardDocument,
} from "@/features/editor/__tests__/sample-document";
import { Result } from "@/utils/Result";
import { OpenedDocument } from "../index";

const PATH = "/work/login.dcmp";

test("読み込んだ内容が正しければ、そのドキュメントを開いた状態になる", () => {
  const opened = OpenedDocument.fromContent(PATH, artboardContent("home"));

  // JSON を経由すると省略可能なキーが落ちるため、キーの有無ではなく値で比べる。
  expect(Result.unwrap(opened)).toEqual({
    path: PATH,
    document: artboardDocument("home"),
  });
});

test("新規作成したドキュメントには既定のトークンが入っている", () => {
  const created = OpenedDocument.createFromTemplate(PATH);

  expect(created.document.tokens).toStrictEqual(
    DocumentTemplate.DEFAULT.tokens,
  );
});

test("新規作成したドキュメントには初期の部品セットが入っている", () => {
  const created = OpenedDocument.createFromTemplate(PATH);

  expect(created.document.components).toStrictEqual(
    DocumentTemplate.DEFAULT.components,
  );
});

test("新規作成したドキュメントは選んだ保存先を持つ", () => {
  const created = OpenedDocument.createFromTemplate(PATH);

  expect(created.path).toBe(PATH);
});

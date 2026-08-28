import { expect, test } from "vitest";
import { danglingTokenContent } from "@/domains/__tests__/sample-document";
import { DocumentError } from "@/domains/session/document-error";
import { DocumentJson } from "@/libs/document-json";
import { Result } from "@/utils/Result";
import { OpenedDocument } from "../index";

/*
 * 開ける／開けないの線引き（docs/03-schema.md「不正ファイル時の挙動」の「開く時」）。
 * ドキュメントとして組み立てられたかで分かれ、スキーマ検証の結果では分かれない。
 */

const Path = "/work/login.dcmp";

test("テキストが JSON として壊れているファイルは開けず、エラーの位置が分かる", () => {
  const opened = OpenedDocument.fromParsed(
    Path,
    DocumentJson.parse('{ "formatVersion": '),
  );

  expect(opened.ok ? [] : opened.error).toStrictEqual([
    {
      kind: "syntax-error",
      message: expect.any(String),
      location: { kind: "text-position", position: expect.any(Number) },
    },
  ]);
});

test("スキーマ検証にだけ落ちるファイルは、そのまま開ける", () => {
  const opened = OpenedDocument.fromParsed(
    Path,
    DocumentJson.parse(danglingTokenContent("home")),
  );

  expect(Result.unwrap(opened).path).toBe(Path);
});

test("開いたドキュメントには、その不正がそのまま残っている", () => {
  const opened = OpenedDocument.fromParsed(
    Path,
    DocumentJson.parse(danglingTokenContent("home")),
  );

  // 開くときに黙って直す（不正な参照を落とす）実装だと、ここが空になって落ちる。
  expect(
    DocumentError.collectFrom(Result.unwrap(opened).document),
  ).toStrictEqual([
    {
      kind: "dangling-token",
      message: expect.any(String),
      location: { kind: "node", nodeName: "home-title", prop: "typography" },
    },
  ]);
});

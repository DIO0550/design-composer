import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node } from "@/domains/dcmp/node";
import { Result } from "@/utils/Result";
import { DocumentJson } from "../index";

/**
 * major 1 の綴り（`direction`）で書かれたファイルのテキスト。
 *
 * 読み込みの入口から確かめるのは、登録済みのステップ（`RegisteredMigrationSteps`）を
 * 通る経路がここしか無いため。ステップ単体のテストは登録漏れを拾えない。
 *
 * @returns major 1 のドキュメントのテキスト
 */
function setupV1Text(): string {
  return `{
  "formatVersion": "1.0",
  "tokens": {},
  "components": {},
  "artboards": [
    {
      "name": "home",
      "width": 375,
      "height": 812,
      "props": { "direction": "row" },
      "children": [
        { "name": "box", "type": "Box", "props": { "direction": "column" } }
      ]
    }
  ]
}`;
}

test("major 1 のファイルを読み込むと現行版のドキュメントになる", () => {
  const document = Result.unwrap(DocumentJson.parse(setupV1Text()));

  expect(document.formatVersion).toEqual({ major: 2, minor: 0 });
});

test("major 1 のファイルの direction は layout として読み込まれる", () => {
  const document = Result.unwrap(DocumentJson.parse(setupV1Text()));

  const artboard = document.artboards[0];
  const child = artboard.children[0];
  expect([
    artboard.props,
    Node.isPrimitive(child) ? child.props : undefined,
  ]).toEqual([{ layout: "row" }, { layout: "column" }]);
});

test("major 1 のファイルを読み込んだドキュメントはスキーマ検証を通る", () => {
  const document = Result.unwrap(DocumentJson.parse(setupV1Text()));

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

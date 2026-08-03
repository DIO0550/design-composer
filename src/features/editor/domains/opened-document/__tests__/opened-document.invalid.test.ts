import { expect, test } from "vitest";
import { Artboard } from "@/domains/artboard";
import { DesignDocument } from "@/domains/design-document";
import { DocumentJson } from "@/libs/document-json";
import { OpenedDocument } from "../index";

const PATH = "/work/login.dcmp";

/** 定義されていない部品を参照するドキュメント（スキーマ検証で dangling ref になる）。 */
function danglingRefContent(): string {
  return DocumentJson.serialize(
    DesignDocument.create({
      artboards: [
        Artboard.create({
          name: "home",
          width: 360,
          height: 240,
          children: [{ name: "home-login", ref: "missing-button" }],
        }),
      ],
    }),
  );
}

test("テキストが JSON として壊れているファイルは開けず、エラーの位置が分かる", () => {
  const opened = OpenedDocument.fromContent(PATH, '{ "formatVersion": ');

  expect(opened.ok ? [] : opened.error).toStrictEqual([
    {
      kind: "syntax-error",
      message: expect.any(String),
      location: { kind: "text-position", position: expect.any(Number) },
    },
  ]);
});

test("存在しない部品を参照しているファイルは開けず、そのノードが指される", () => {
  const opened = OpenedDocument.fromContent(PATH, danglingRefContent());

  expect(opened.ok ? [] : opened.error).toStrictEqual([
    {
      kind: "dangling-ref",
      message: expect.any(String),
      location: { kind: "node", nodeName: "home-login" },
    },
  ]);
});

import { expect, test } from "vitest";
import { Artboard } from "@/domains/artboard";
import { DesignDocument } from "@/domains/design-document";
import { Result } from "@/utils/Result";
import { DocumentReload } from "../index";

/** artboard を 1 枚だけ持つ、スキーマ検証を通るドキュメント。 */
function artboardDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [Artboard.create({ name: "home", width: 360, height: 240 })],
  });
}

test("解釈できたドキュメントに不正が無ければ、そのまま取り込まれる", () => {
  const document = artboardDocument();

  const reload = DocumentReload.fromParsed(Result.ok(document));

  expect(reload).toStrictEqual({ kind: "reloaded", document });
});

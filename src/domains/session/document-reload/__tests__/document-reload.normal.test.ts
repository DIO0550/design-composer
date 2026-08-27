import { expect, test } from "vitest";
import { artboardDocument } from "@/domains/__tests__/sample-document";
import { Result } from "@/utils/Result";
import { DocumentReload } from "../index";

test("解釈できたドキュメントに不正が無ければ、そのまま取り込まれる", () => {
  const document = artboardDocument("home");

  const reload = DocumentReload.fromParsed(Result.ok(document));

  expect(reload).toStrictEqual({ kind: "reloaded", document });
});

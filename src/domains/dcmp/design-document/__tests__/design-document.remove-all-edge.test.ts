import { expect, test } from "vitest";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";
import { documentWithOneArtboard } from "./artboard-edit-setup";

test("ドキュメントに無い名前が混ざると、何も取り除かずに node-not-found を返す", () => {
  expect(
    DesignDocument.removeAll(documentWithOneArtboard(), [
      "home-title",
      "missing",
    ]),
  ).toEqual(Result.err({ kind: "node-not-found", name: "missing" }));
});

test("空の並びを渡すとドキュメントをそのまま返す", () => {
  const document = documentWithOneArtboard();

  expect(DesignDocument.removeAll(document, [])).toEqual(Result.ok(document));
});

import { expect, test } from "vitest";
import { Artboard } from "@/domains/artboard";
import { DesignDocument } from "@/domains/design-document";
import type { DocumentError } from "@/domains/document-error";
import { Result } from "@/utils/Result";
import { DocumentReload } from "../index";

/** テキストの解釈が返す失敗。位置の割り当ては `libs/document-json` の担当。 */
const SampleSyntaxError: DocumentError = {
  kind: "syntax-error",
  message: "expected ',' or '}'",
  location: { kind: "text-position", position: 42 },
};

test("解釈に失敗していたら、その理由をそのまま拒む理由にする", () => {
  const reload = DocumentReload.fromParsed(Result.err([SampleSyntaxError]));

  expect(reload).toStrictEqual({
    kind: "rejected",
    errors: [SampleSyntaxError],
  });
});

test("スキーマに無い prop を持つドキュメントは、そのノードの名前つきで拒まれる", () => {
  const document = DesignDocument.create({
    artboards: [
      Artboard.create({
        name: "home",
        width: 360,
        height: 240,
        props: { colour: "white" },
      }),
    ],
  });

  const reload = DocumentReload.fromParsed(Result.ok(document));

  expect(reload).toStrictEqual({
    kind: "rejected",
    errors: [
      {
        kind: "unknown-prop",
        message: 'unknown prop "colour"',
        location: { kind: "node", nodeName: "home", prop: "colour" },
      },
    ],
  });
});

test("存在しない部品を参照するドキュメントは、参照しているノードの名前つきで拒まれる", () => {
  const document = DesignDocument.create({
    artboards: [
      Artboard.create({
        name: "home",
        width: 360,
        height: 240,
        children: [{ name: "cta", ref: "missing-button" }],
      }),
    ],
  });

  const reload = DocumentReload.fromParsed(Result.ok(document));

  expect(reload).toStrictEqual({
    kind: "rejected",
    errors: [
      {
        kind: "dangling-ref",
        message: 'unknown component "missing-button"',
        location: { kind: "node", nodeName: "cta" },
      },
    ],
  });
});

test("スキーマ違反が 2 件あるドキュメントは、両方が並んで拒まれる", () => {
  const document = DesignDocument.create({
    artboards: [
      Artboard.create({
        name: "home",
        width: 360,
        height: 240,
        props: { colour: "white" },
        children: [{ name: "cta", ref: "missing-button" }],
      }),
    ],
  });

  const reload = DocumentReload.fromParsed(Result.ok(document));

  const kinds =
    reload.kind === "rejected" ? reload.errors.map((error) => error.kind) : [];

  expect(kinds).toEqual(["unknown-prop", "dangling-ref"]);
});

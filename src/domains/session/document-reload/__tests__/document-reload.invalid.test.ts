import { expect, test } from "vitest";
import { SampleSyntaxError } from "@/domains/__tests__/document-errors";
import { Artboard } from "@/domains/dcmp/artboard";
import { DesignDocument } from "@/domains/dcmp/design-document";
import type { Node, Props } from "@/domains/dcmp/node";
import { Result } from "@/utils/Result";
import { DocumentReload } from "../index";

/**
 * artboard を 1 枚だけ持つドキュメント。壊した箇所だけを渡し、それ以外は同じ形にする
 * （各テストで「何を壊したか」が 1 箇所で読めるようにするため）。
 */
function documentWith(
  broken: Readonly<{ props?: Props; children?: readonly Node[] }>,
): DesignDocument {
  return DesignDocument.create({
    artboards: [
      Artboard.create({ name: "home", width: 360, height: 240, ...broken }),
    ],
  });
}

test("解釈に失敗していたら、その理由をそのまま拒む理由にする", () => {
  const reload = DocumentReload.fromParsed(Result.err([SampleSyntaxError]));

  expect(reload).toStrictEqual({
    kind: "rejected",
    errors: [SampleSyntaxError],
  });
});

test("スキーマに無い prop を持つドキュメントは、そのノードの名前つきで拒まれる", () => {
  const reload = DocumentReload.fromParsed(
    Result.ok(documentWith({ props: { colour: "white" } })),
  );

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
  const reload = DocumentReload.fromParsed(
    Result.ok(documentWith({ children: [{ name: "cta", ref: "missing" }] })),
  );

  expect(reload).toStrictEqual({
    kind: "rejected",
    errors: [
      {
        kind: "dangling-ref",
        message: 'unknown component "missing"',
        location: { kind: "node", nodeName: "cta" },
      },
    ],
  });
});

test("スキーマ違反が 2 件あるドキュメントは、両方が並んで拒まれる", () => {
  const reload = DocumentReload.fromParsed(
    Result.ok(
      documentWith({
        props: { colour: "white" },
        children: [{ name: "cta", ref: "missing" }],
      }),
    ),
  );

  const kinds =
    reload.kind === "rejected" ? reload.errors.map((error) => error.kind) : [];

  // 並び順は `DesignDocument.collectErrors` の仕様なので、揃えてから中身だけを見る。
  expect([...kinds].sort()).toEqual(["dangling-ref", "unknown-prop"]);
});

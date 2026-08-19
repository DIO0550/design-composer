import { expect, test } from "vitest";
import { DocumentReload } from "../index";
import { artboardJson, contentOf } from "./setup";

test("JSON として壊れている内容は、テキスト内の位置つきで拒まれる", () => {
  const reload = DocumentReload.fromContent('{ "formatVersion": ');

  expect(reload).toStrictEqual({
    kind: "rejected",
    errors: [
      {
        kind: "syntax-error",
        message: expect.any(String),
        location: { kind: "text-position", position: expect.any(Number) },
      },
    ],
  });
});

test("同じキーが 2 度書かれている内容は、重複として拒まれる", () => {
  const reload = DocumentReload.fromContent(
    '{ "formatVersion": "1.0", "tokens": {}, "tokens": {}, "components": {}, "artboards": [] }',
  );

  expect(reload).toStrictEqual({
    kind: "rejected",
    errors: [
      {
        kind: "duplicate-key",
        message: 'duplicate key "tokens"',
        location: { kind: "text-position", position: expect.any(Number) },
      },
    ],
  });
});

test("値の型が違う内容は、ドキュメント内のパスつきで拒まれる", () => {
  const content = contentOf({
    ...artboardJson(),
    artboards: [
      { name: "home", width: "とても広い", height: 240, children: [] },
    ],
  });

  const reload = DocumentReload.fromContent(content);

  expect(reload).toStrictEqual({
    kind: "rejected",
    errors: [
      {
        kind: "invalid-type",
        message: expect.any(String),
        location: { kind: "document-path", path: "artboards[0].width" },
      },
    ],
  });
});

test("アプリより新しい形式の内容は、位置を持たないエラーとして拒まれる", () => {
  const content = contentOf({ ...artboardJson(), formatVersion: "99.0" });

  const reload = DocumentReload.fromContent(content);

  expect(reload).toStrictEqual({
    kind: "rejected",
    errors: [
      {
        kind: "unsupported-format-version",
        message: expect.any(String),
        location: { kind: "whole-document" },
      },
    ],
  });
});

test("スキーマに無い prop を書いた内容は、そのノードの名前つきで拒まれる", () => {
  const content = contentOf({
    ...artboardJson(),
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        props: { colour: "white" },
        children: [],
      },
    ],
  });

  const reload = DocumentReload.fromContent(content);

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

test("存在しない部品を参照する内容は、参照しているノードの名前つきで拒まれる", () => {
  const content = contentOf({
    ...artboardJson(),
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [{ name: "cta", ref: "missing-button" }],
      },
    ],
  });

  const reload = DocumentReload.fromContent(content);

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

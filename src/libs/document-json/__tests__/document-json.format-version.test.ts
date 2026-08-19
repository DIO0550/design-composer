import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { Result } from "@/utils/Result";
import { DocumentJson } from "../index";

test("major がアプリより新しいファイルを読むとアプリの更新を促すエラーになる", () => {
  const text = `{ "formatVersion": "2.0", "tokens": {}, "components": {}, "artboards": [] }`;

  const result = DocumentJson.parse(text);

  expect(result.ok ? [] : result.error).toEqual([
    expect.objectContaining({
      kind: "unsupported-format-version",
      message: expect.stringContaining("update the app"),
      location: { kind: "whole-document" },
    }),
  ]);
});

test("minor がアプリより新しいファイルを読むとアプリの更新を促すエラーになる", () => {
  const text = `{ "formatVersion": "1.7", "tokens": {}, "components": {}, "artboards": [] }`;

  const result = DocumentJson.parse(text);

  expect(result.ok ? [] : result.error).toEqual([
    expect.objectContaining({
      kind: "unsupported-format-version",
      location: { kind: "whole-document" },
    }),
  ]);
});

test("major がアプリより古いファイルは変換できないとエラーになる（変換ステップ未登録のため）", () => {
  const text = `{ "formatVersion": "0.9", "tokens": {}, "components": {}, "artboards": [] }`;

  const result = DocumentJson.parse(text);

  expect(result.ok ? [] : result.error).toEqual([
    expect.objectContaining({
      kind: "missing-migration-step",
      location: { kind: "whole-document" },
    }),
  ]);
});

test("formatVersion が欠けているファイルは版のエラーではなく必須フィールドの欠落として報告される", () => {
  const text = `{ "tokens": {}, "components": {}, "artboards": [] }`;

  const result = DocumentJson.parse(text);

  expect(result.ok ? [] : result.error).toEqual([
    expect.objectContaining({
      kind: "missing-field",
      location: { kind: "document-path", path: "formatVersion" },
    }),
  ]);
});

test("書き出しは常に現在の形式を名乗る", () => {
  const document = DesignDocument.create({
    formatVersion: { major: 1, minor: 9 },
  });

  const text = DocumentJson.serialize(document);

  expect(text).toContain(`"formatVersion": "1.0"`);
});

test("違う minor を名乗るドキュメントを書き出しても読み直せる", () => {
  const document = DesignDocument.create({
    formatVersion: { major: 1, minor: 9 },
  });

  const reloaded = Result.unwrap(
    DocumentJson.parse(DocumentJson.serialize(document)),
  );

  expect(reloaded.formatVersion).toEqual({ major: 1, minor: 0 });
});

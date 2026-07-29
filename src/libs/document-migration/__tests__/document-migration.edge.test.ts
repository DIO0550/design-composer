import { expect, test } from "vitest";
import type { JsonRecord } from "@/utils/Json";
import { Result } from "@/utils/Result";
import {
  DocumentMigration,
  DocumentMigrationError,
  type MigrationStep,
} from "../index";

function setupFailingStep(): MigrationStep {
  return {
    fromMajor: 0,
    migrate: () => Result.err("tokens が読めない形になっている"),
  };
}

test("major がアプリより大きいファイルは unsupported-format-version になる", () => {
  const document: JsonRecord = { formatVersion: "2.0" };

  expect(DocumentMigration.toCurrent(document)).toEqual({
    ok: false,
    error: {
      kind: "unsupported-format-version",
      fileVersion: { major: 2, minor: 0 },
      appVersion: { major: 1, minor: 0 },
    },
  });
});

test("major が一致し minor がアプリより大きいファイルは unsupported-format-version になる", () => {
  const document: JsonRecord = { formatVersion: "1.5" };

  expect(DocumentMigration.toCurrent(document)).toEqual({
    ok: false,
    error: {
      kind: "unsupported-format-version",
      fileVersion: { major: 1, minor: 5 },
      appVersion: { major: 1, minor: 0 },
    },
  });
});

test("新しすぎるファイルのメッセージはアプリの更新を促す", () => {
  const result = DocumentMigration.toCurrent({ formatVersion: "2.0" });

  expect(
    result.ok ? "" : DocumentMigrationError.message(result.error),
  ).toContain("update the app");
});

test("変換すべき major のステップが無いと missing-migration-step になる", () => {
  const document: JsonRecord = { formatVersion: "0.9" };

  expect(DocumentMigration.toCurrent(document)).toEqual({
    ok: false,
    error: { kind: "missing-migration-step", fromMajor: 0 },
  });
});

test("ステップが失敗すると理由を持つ migration-step-failed になる", () => {
  const document: JsonRecord = { formatVersion: "0.9" };

  expect(DocumentMigration.toCurrent(document, [setupFailingStep()])).toEqual({
    ok: false,
    error: {
      kind: "migration-step-failed",
      fromMajor: 0,
      reason: "tokens が読めない形になっている",
    },
  });
});

test("formatVersion が major.minor 形式でない入力はそのまま通る", () => {
  const document: JsonRecord = { formatVersion: "1" };

  expect(DocumentMigration.toCurrent(document)).toEqual({
    ok: true,
    value: document,
  });
});

test("オブジェクトでない入力はそのまま通る", () => {
  expect(DocumentMigration.toCurrent([])).toEqual({ ok: true, value: [] });
});

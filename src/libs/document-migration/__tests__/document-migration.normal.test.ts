import { expect, test } from "vitest";
import type { JsonRecord } from "@/utils/Json";
import { Result } from "@/utils/Result";
import { DocumentMigration, type MigrationSteps } from "../index";

/**
 * 登録済みのステップは（破壊的変更がまだ無いため）空なので、
 * 枠組みの振る舞いは設計上の拡張点であるステップを渡して確かめる。
 */
function setupRenameSteps(): MigrationSteps {
  return {
    0: (document) => Result.ok({ ...document, tokens: document.palette ?? {} }),
  };
}

function setupDocument(formatVersion: string): JsonRecord {
  return { formatVersion, palette: { colors: {} }, artboards: [] };
}

/** 適用の順序を残すステップ。major の昇順に適用されたかを痕跡で確かめる。 */
function setupTrailSteps(): MigrationSteps {
  return {
    0: (document) =>
      Result.ok({ ...document, trail: `${String(document.trail)}-0` }),
    1: (document) =>
      Result.ok({ ...document, trail: `${String(document.trail)}-1` }),
  };
}

test("アプリと同じ形式のドキュメントはそのまま通る", () => {
  const document = setupDocument("1.0");

  expect(DocumentMigration.toCurrent(document)).toEqual({
    ok: true,
    value: document,
  });
});

test("major がアプリより小さいドキュメントは登録されたステップで変換される", () => {
  const document = setupDocument("0.9");

  const migrated = Result.unwrap(
    DocumentMigration.toCurrent(document, setupRenameSteps()),
  );

  expect(migrated).toMatchObject({ tokens: { colors: {} } });
});

test("変換後のドキュメントは上げた先の major を名乗る", () => {
  const document = setupDocument("0.9");

  const migrated = Result.unwrap(
    DocumentMigration.toCurrent(document, setupRenameSteps()),
  );

  expect(migrated).toMatchObject({ formatVersion: "1.0" });
});

test("major が2つ以上離れていてもステップは major の昇順に適用される", () => {
  const document: JsonRecord = { formatVersion: "0.1", trail: "start" };

  const migrated = Result.unwrap(
    DocumentMigration.toCurrent(document, setupTrailSteps(), {
      major: 2,
      minor: 0,
    }),
  );

  expect(migrated).toMatchObject({ trail: "start-0-1", formatVersion: "2.0" });
});

test("formatVersion を持たない入力はそのまま通る", () => {
  const document: JsonRecord = { tokens: {} };

  expect(DocumentMigration.toCurrent(document)).toEqual({
    ok: true,
    value: document,
  });
});

test("元のドキュメントは変換で書き換えられない", () => {
  const document = setupDocument("0.9");

  DocumentMigration.toCurrent(document, setupRenameSteps());

  expect(document).toEqual({
    formatVersion: "0.9",
    palette: { colors: {} },
    artboards: [],
  });
});

import { expect, test } from "vitest";
import type { JsonRecord } from "@/utils/Json";
import { Result } from "@/utils/Result";
import { DocumentMigration, type MigrationStep } from "../index";

/**
 * 登録済みのステップは（破壊的変更がまだ無いため）空なので、
 * 枠組みの振る舞いは設計上の拡張点であるステップを渡して確かめる。
 */
function setupRenameStep(): MigrationStep {
  return {
    fromMajor: 0,
    migrate: (document) =>
      Result.ok({ ...document, tokens: document.palette ?? {} }),
  };
}

function setupDocument(formatVersion: string): JsonRecord {
  return { formatVersion, palette: { colors: {} }, artboards: [] };
}

/** 適用の順序を残すステップ。`fromMajor` の順に適用されたかを痕跡で確かめる。 */
function setupTrailStep(fromMajor: number): MigrationStep {
  return {
    fromMajor,
    migrate: (document) =>
      Result.ok({
        ...document,
        trail: `${String(document.trail)}-${fromMajor}`,
      }),
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
    DocumentMigration.toCurrent(document, [setupRenameStep()]),
  );

  expect(migrated).toMatchObject({ tokens: { colors: {} } });
});

test("変換後のドキュメントは上げた先の major を名乗る", () => {
  const document = setupDocument("0.9");

  const migrated = Result.unwrap(
    DocumentMigration.toCurrent(document, [setupRenameStep()]),
  );

  expect(migrated).toMatchObject({ formatVersion: "1.0" });
});

test("major が2つ以上離れていてもステップは major の昇順に適用される", () => {
  const document: JsonRecord = { formatVersion: "0.1", trail: "start" };
  // 並び順ではなく fromMajor で順序が決まることを見るため、あえて降順で渡す
  const steps = [setupTrailStep(1), setupTrailStep(0)];

  const migrated = Result.unwrap(
    DocumentMigration.toCurrent(document, steps, { major: 2, minor: 0 }),
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

  DocumentMigration.toCurrent(document, [setupRenameStep()]);

  expect(document).toEqual({
    formatVersion: "0.9",
    palette: { colors: {} },
    artboards: [],
  });
});

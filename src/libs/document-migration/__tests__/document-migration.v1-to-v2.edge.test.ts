import { expect, test } from "vitest";
import type { JsonRecord } from "@/utils/Json";
import { Result } from "@/utils/Result";
import { DocumentMigration, DocumentMigrationError } from "../index";

function setupDocument(overrides: JsonRecord): JsonRecord {
  return {
    formatVersion: "1.0",
    tokens: {},
    components: {},
    artboards: [],
    ...overrides,
  };
}

test("padding を持たないノードは読み替えで変わらない", () => {
  const document = setupDocument({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [{ name: "box", type: "Box", props: { gap: "md" } }],
      },
    ],
  });

  const migrated = Result.unwrap(DocumentMigration.toCurrent(document));

  expect(migrated).toMatchObject({
    artboards: [{ children: [{ props: { gap: "md" } }] }],
  });
});

test("公開 prop が paddingX へ binding されていると変換できない", () => {
  const document = setupDocument({
    components: {
      card: {
        publicProps: { pad: { node: "card", prop: "paddingX" } },
        type: "Box",
        props: { paddingX: "lg" },
      },
    },
  });

  const result = DocumentMigration.toCurrent(document);

  expect(result.ok ? "" : result.error.kind).toBe("migration-step-failed");
});

test("変換できない理由には対象の部品名と公開 prop 名が出る", () => {
  const document = setupDocument({
    components: {
      card: {
        publicProps: { pad: { node: "card", prop: "paddingY" } },
        type: "Box",
      },
    },
  });

  const result = DocumentMigration.toCurrent(document);

  expect(
    result.ok ? "" : DocumentMigrationError.message(result.error),
  ).toContain("card.pad");
});

/*
 * 以下は「形が壊れた入力でも変換が失敗しない」ことを見る。マイグレーションは
 * `DesignDocument.fromJson` が形を検証する前に走るので、形を仮定して走査すると
 * 例外になる。形の不備はデコード側が報告するので、ここでは素通しさせる。
 */

test("artboards が配列でない入力でも変換は失敗しない", () => {
  const document = setupDocument({ artboards: {} });

  expect(DocumentMigration.toCurrent(document).ok).toBe(true);
});

test("components がオブジェクトでない入力でも変換は失敗しない", () => {
  const document = setupDocument({ components: [] });

  expect(DocumentMigration.toCurrent(document).ok).toBe(true);
});

test("props がオブジェクトでないノードがあっても変換は失敗しない", () => {
  const document = setupDocument({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [{ name: "box", type: "Box", props: "lg" }],
      },
    ],
  });

  expect(DocumentMigration.toCurrent(document).ok).toBe(true);
});

test("tokens と artboards を持たない入力でも変換は失敗しない", () => {
  expect(DocumentMigration.toCurrent({ formatVersion: "1.0" }).ok).toBe(true);
});

test("既に4方向の prop を持つ辺は軸の値で上書きされない", () => {
  const document = setupDocument({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [
          {
            name: "box",
            type: "Box",
            props: { paddingX: "lg", paddingLeft: "xs" },
          },
        ],
      },
    ],
  });

  const migrated = Result.unwrap(DocumentMigration.toCurrent(document));

  expect(migrated).toMatchObject({
    artboards: [
      {
        children: [{ props: { paddingLeft: "xs", paddingRight: "lg" } }],
      },
    ],
  });
});

test("元のドキュメントは変換で書き換えられない", () => {
  const document = setupDocument({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [{ name: "box", type: "Box", props: { paddingX: "lg" } }],
      },
    ],
  });

  DocumentMigration.toCurrent(document);

  expect(document).toMatchObject({
    formatVersion: "1.0",
    artboards: [{ children: [{ props: { paddingX: "lg" } }] }],
  });
});

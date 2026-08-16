import { expect, test } from "vitest";
import type { JsonRecord } from "@/utils/Json";
import { Result } from "@/utils/Result";
import { migrateV1ToV2 } from "../index";

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

  const migrated = Result.unwrap(migrateV1ToV2(document));

  expect(migrated).toEqual(document);
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

  expect(migrateV1ToV2(document).ok).toBe(false);
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

  const result = migrateV1ToV2(document);

  expect(result.ok ? "" : result.error).toContain("card.pad");
});

test("軸以外へ binding された公開 prop は変換を止めない", () => {
  const document = setupDocument({
    components: {
      card: {
        publicProps: { title: { node: "card-title", prop: "content" } },
        type: "Box",
      },
    },
  });

  expect(migrateV1ToV2(document).ok).toBe(true);
});

/*
 * 以下は「形が壊れた入力でも変換が失敗しない」ことを見る。マイグレーションは
 * `DesignDocument.fromJson` が形を検証する前に走るので、形を仮定して走査すると
 * 例外になる。形の不備はデコード側が報告するので、ここでは素通しさせる。
 * 素通しは `.ok` ではなく入力がそのまま残ることで確かめる（握り潰して捨てる実装を
 * 落とすため）。
 */

test("artboards が配列でない入力はそのまま通る", () => {
  const document = setupDocument({ artboards: {} });

  expect(Result.unwrap(migrateV1ToV2(document))).toEqual(document);
});

test("components がオブジェクトでない入力はそのまま通る", () => {
  const document = setupDocument({ components: [] });

  expect(Result.unwrap(migrateV1ToV2(document))).toEqual(document);
});

test("props がオブジェクトでないノードはそのまま通る", () => {
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

  expect(Result.unwrap(migrateV1ToV2(document))).toEqual(document);
});

test("tokens と artboards を持たない入力はそのまま通る", () => {
  const document: JsonRecord = { formatVersion: "1.0" };

  expect(Result.unwrap(migrateV1ToV2(document))).toEqual(document);
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

  const migrated = Result.unwrap(migrateV1ToV2(document));
  const artboards = migrated.artboards as readonly JsonRecord[];
  const children = artboards[0]?.children as readonly JsonRecord[];

  expect(children[0]?.props).toEqual({
    paddingLeft: "xs",
    paddingRight: "lg",
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

  migrateV1ToV2(document);

  expect(document).toEqual(
    setupDocument({
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [{ name: "box", type: "Box", props: { paddingX: "lg" } }],
        },
      ],
    }),
  );
});

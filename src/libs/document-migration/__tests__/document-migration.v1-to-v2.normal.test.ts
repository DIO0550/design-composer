import { expect, test } from "vitest";
import type { JsonRecord } from "@/utils/Json";
import { Result } from "@/utils/Result";
import { DocumentMigration } from "../index";

/**
 * 登録済みのステップ（アプリが実際に使う変換）を通す。差し替えたステップでは
 * `RegisteredMigrationSteps` への登録漏れを検出できないため、既定のまま呼ぶ。
 */
function migrate(document: JsonRecord): JsonRecord {
  return Result.unwrap(DocumentMigration.toCurrent(document)) as JsonRecord;
}

function setupDocument(overrides: JsonRecord): JsonRecord {
  return {
    formatVersion: "1.0",
    tokens: {},
    components: {},
    artboards: [],
    ...overrides,
  };
}

test("artboard の子ノードの paddingX は左右の2辺になる", () => {
  const migrated = migrate(
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

  expect(migrated).toMatchObject({
    artboards: [
      {
        children: [{ props: { paddingLeft: "lg", paddingRight: "lg" } }],
      },
    ],
  });
});

test("artboard の子ノードの paddingY は上下の2辺になる", () => {
  const migrated = migrate(
    setupDocument({
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [{ name: "box", type: "Box", props: { paddingY: "sm" } }],
        },
      ],
    }),
  );

  expect(migrated).toMatchObject({
    artboards: [
      {
        children: [{ props: { paddingTop: "sm", paddingBottom: "sm" } }],
      },
    ],
  });
});

test("読み替えた props に軸の prop は残らない", () => {
  const migrated = migrate(
    setupDocument({
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            { name: "box", type: "Box", props: { paddingX: "lg", gap: "md" } },
          ],
        },
      ],
    }),
  );

  const artboards = migrated.artboards as readonly JsonRecord[];
  const children = artboards[0]?.children as readonly JsonRecord[];

  expect(children[0]?.props).toEqual({
    paddingLeft: "lg",
    paddingRight: "lg",
    gap: "md",
  });
});

test("artboard 自身の props も読み替えられる", () => {
  const migrated = migrate(
    setupDocument({
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          props: { paddingX: "md", paddingY: "sm" },
          children: [],
        },
      ],
    }),
  );

  expect(migrated).toMatchObject({
    artboards: [
      {
        props: {
          paddingTop: "sm",
          paddingRight: "md",
          paddingBottom: "sm",
          paddingLeft: "md",
        },
      },
    ],
  });
});

test("部品の中のノードも読み替えられる", () => {
  const migrated = migrate(
    setupDocument({
      components: {
        card: {
          type: "Box",
          props: { paddingX: "lg" },
          children: [
            { name: "card-inner", type: "Box", props: { paddingY: "sm" } },
          ],
        },
      },
    }),
  );

  expect(migrated).toMatchObject({
    components: {
      card: {
        props: { paddingLeft: "lg", paddingRight: "lg" },
        children: [{ props: { paddingTop: "sm", paddingBottom: "sm" } }],
      },
    },
  });
});

test("入れ子の奥にあるノードまで読み替えが届く", () => {
  const migrated = migrate(
    setupDocument({
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            {
              name: "outer",
              type: "Box",
              children: [
                { name: "inner", type: "Box", props: { paddingX: "xs" } },
              ],
            },
          ],
        },
      ],
    }),
  );

  expect(migrated).toMatchObject({
    artboards: [
      {
        children: [
          {
            children: [{ props: { paddingLeft: "xs", paddingRight: "xs" } }],
          },
        ],
      },
    ],
  });
});

test("変換後のドキュメントは 2.0 を名乗る", () => {
  expect(migrate(setupDocument({}))).toMatchObject({ formatVersion: "2.0" });
});

import { expect, test } from "vitest";
import type { JsonRecord } from "@/utils/Json";
import { Result } from "@/utils/Result";
import { migrateV1ToV2 } from "../index";

/**
 * artboard 1 枚と、その中のノードを持つ major 1 のドキュメント。
 *
 * @param props artboard 直下のノードに設定する props
 * @returns そのノードを持つ major 1 のドキュメント
 */
function setupDocument(props: JsonRecord): JsonRecord {
  return {
    formatVersion: "1.0",
    tokens: {},
    components: {},
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        props: { direction: "row" },
        children: [{ name: "box", type: "Box", props }],
      },
    ],
  };
}

/**
 * 変換した artboard 直下のノードの props。
 *
 * @param document 変換した結果のドキュメント
 * @returns そのノードの props
 */
function nodePropsOf(document: JsonRecord): unknown {
  const artboards = document.artboards as readonly JsonRecord[];
  const children = artboards[0].children as readonly JsonRecord[];
  return children[0].props;
}

test("ノードの direction は layout へ移る", () => {
  const migrated = Result.unwrap(
    migrateV1ToV2(setupDocument({ direction: "row", gap: "md" })),
  );

  expect(nodePropsOf(migrated)).toEqual({ layout: "row", gap: "md" });
});

test("artboard の direction も layout へ移る", () => {
  const migrated = Result.unwrap(migrateV1ToV2(setupDocument({})));

  const artboards = migrated.artboards as readonly JsonRecord[];
  expect(artboards[0].props).toEqual({ layout: "row" });
});

test("direction を持たない props はそのまま残る", () => {
  const migrated = Result.unwrap(
    migrateV1ToV2(setupDocument({ gap: "md", widthMode: "fill" })),
  );

  // toStrictEqual にするのは、`layout: undefined` を足す壊し方が toEqual では通るため
  expect(nodePropsOf(migrated)).toStrictEqual({ gap: "md", widthMode: "fill" });
});

test("direction と layout の両方があるときは direction の値が残る", () => {
  const migrated = Result.unwrap(
    migrateV1ToV2(setupDocument({ direction: "row", layout: "column" })),
  );

  expect(nodePropsOf(migrated)).toEqual({ layout: "row" });
});

test("部品の中のノードの direction も layout へ移る", () => {
  const document: JsonRecord = {
    formatVersion: "1.0",
    tokens: {},
    components: {
      card: {
        type: "Box",
        props: { direction: "row" },
        children: [
          { name: "card-body", type: "Box", props: { direction: "column" } },
        ],
      },
    },
    artboards: [],
  };

  const migrated = Result.unwrap(migrateV1ToV2(document));

  const components = migrated.components as JsonRecord;
  const card = components.card as JsonRecord;
  const children = card.children as readonly JsonRecord[];
  expect([card.props, children[0].props]).toEqual([
    { layout: "row" },
    { layout: "column" },
  ]);
});

test("プリミティブを指す公開 prop の binding は layout を指すようになる", () => {
  const document: JsonRecord = {
    formatVersion: "1.0",
    tokens: {},
    components: {
      card: {
        publicProps: { flow: { node: "card-body", prop: "direction" } },
        type: "Box",
        children: [{ name: "card-body", type: "Box" }],
      },
    },
    artboards: [],
  };

  const migrated = Result.unwrap(migrateV1ToV2(document));

  const components = migrated.components as JsonRecord;
  const card = components.card as JsonRecord;
  expect(card.publicProps).toEqual({
    flow: { node: "card-body", prop: "layout" },
  });
});

test("部品のルートを指す公開 prop の binding も layout を指すようになる", () => {
  const document: JsonRecord = {
    formatVersion: "1.0",
    tokens: {},
    components: {
      card: {
        publicProps: { flow: { node: "card", prop: "direction" } },
        type: "Box",
      },
    },
    artboards: [],
  };

  const migrated = Result.unwrap(migrateV1ToV2(document));

  const components = migrated.components as JsonRecord;
  const card = components.card as JsonRecord;
  expect(card.publicProps).toEqual({
    flow: { node: "card", prop: "layout" },
  });
});

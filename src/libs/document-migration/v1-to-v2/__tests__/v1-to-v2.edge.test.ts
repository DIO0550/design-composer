import { expect, test } from "vitest";
import type { JsonRecord } from "@/utils/Json";
import { Result } from "@/utils/Result";
import { migrateV1ToV2 } from "../index";

/**
 * `direction` という名前の公開 prop を持つ部品と、そのインスタンス。
 *
 * @param bindingProp その公開 prop が指している内部ノードの prop 名
 * @returns 部品とインスタンスを持つ major 1 のドキュメント
 */
function setupDocument(bindingProp: string): JsonRecord {
  return {
    formatVersion: "1.0",
    tokens: {},
    components: {
      card: {
        publicProps: { direction: { node: "card-body", prop: bindingProp } },
        type: "Box",
        children: [{ name: "card-body", type: "Box" }],
      },
    },
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [
          { name: "card-1", ref: "card", overrides: { direction: "row" } },
        ],
      },
    ],
  };
}

test("公開 prop の名前が direction でもインスタンスの overrides は変わらない", () => {
  const migrated = Result.unwrap(migrateV1ToV2(setupDocument("gap")));

  const artboards = migrated.artboards as readonly JsonRecord[];
  const children = artboards[0].children as readonly JsonRecord[];
  expect(children[0].overrides).toEqual({ direction: "row" });
});

test("公開 prop の名前が direction でも publicProps のキーは変わらない", () => {
  const migrated = Result.unwrap(migrateV1ToV2(setupDocument("gap")));

  const components = migrated.components as JsonRecord;
  const card = components.card as JsonRecord;
  expect(Object.keys(card.publicProps as JsonRecord)).toEqual(["direction"]);
});

test("参照ノードを指す binding の prop は入れ子の部品の公開 prop 名なので移さない", () => {
  const document: JsonRecord = {
    formatVersion: "1.0",
    tokens: {},
    components: {
      inner: { type: "Box" },
      outer: {
        publicProps: { flow: { node: "nested", prop: "direction" } },
        type: "Box",
        children: [{ name: "nested", ref: "inner" }],
      },
    },
    artboards: [],
  };

  const migrated = Result.unwrap(migrateV1ToV2(document));

  const components = migrated.components as JsonRecord;
  const outer = components.outer as JsonRecord;
  expect(outer.publicProps).toEqual({
    flow: { node: "nested", prop: "direction" },
  });
});

test("props を持たないドキュメントもそのまま変換できる", () => {
  const document: JsonRecord = {
    formatVersion: "1.0",
    tokens: {},
    components: {},
    artboards: [],
  };

  expect(Result.unwrap(migrateV1ToV2(document))).toEqual(document);
});

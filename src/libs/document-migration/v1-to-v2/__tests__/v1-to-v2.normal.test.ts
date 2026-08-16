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

function setupArtboard(artboard: JsonRecord): JsonRecord {
  return setupDocument({
    artboards: [{ name: "home", width: 375, height: 812, ...artboard }],
  });
}

/**
 * 読み替え後の 1 か所の props を取り出す。`toMatchObject` で部分一致にすると
 * 軸の prop が残っていても通ってしまうので、props 1 つ分を丸ごと比べる。
 */
function propsAt(document: JsonRecord, path: readonly string[]): unknown {
  const migrated = Result.unwrap(migrateV1ToV2(document));
  return path.reduce<unknown>(
    (current, key) =>
      Array.isArray(current)
        ? current[Number(key)]
        : (current as JsonRecord)[key],
    migrated,
  );
}

test("ノードの paddingX は左右の2辺になる", () => {
  const document = setupArtboard({
    children: [{ name: "box", type: "Box", props: { paddingX: "lg" } }],
  });

  expect(
    propsAt(document, ["artboards", "0", "children", "0", "props"]),
  ).toEqual({ paddingLeft: "lg", paddingRight: "lg" });
});

test("ノードの paddingY は上下の2辺になる", () => {
  const document = setupArtboard({
    children: [{ name: "box", type: "Box", props: { paddingY: "sm" } }],
  });

  expect(
    propsAt(document, ["artboards", "0", "children", "0", "props"]),
  ).toEqual({ paddingTop: "sm", paddingBottom: "sm" });
});

test("軸以外の prop は読み替えで残る", () => {
  const document = setupArtboard({
    children: [
      { name: "box", type: "Box", props: { paddingX: "lg", gap: "md" } },
    ],
  });

  expect(
    propsAt(document, ["artboards", "0", "children", "0", "props"]),
  ).toEqual({ paddingLeft: "lg", paddingRight: "lg", gap: "md" });
});

test("artboard 自身の props も読み替えられる", () => {
  const document = setupArtboard({
    props: { paddingX: "md", paddingY: "sm" },
    children: [],
  });

  expect(propsAt(document, ["artboards", "0", "props"])).toEqual({
    paddingTop: "sm",
    paddingRight: "md",
    paddingBottom: "sm",
    paddingLeft: "md",
  });
});

test("部品定義自身の props も読み替えられる", () => {
  const document = setupDocument({
    components: { card: { type: "Box", props: { paddingX: "lg" } } },
  });

  expect(propsAt(document, ["components", "card", "props"])).toEqual({
    paddingLeft: "lg",
    paddingRight: "lg",
  });
});

test("部品の中のノードも読み替えられる", () => {
  const document = setupDocument({
    components: {
      card: {
        type: "Box",
        children: [
          { name: "card-inner", type: "Box", props: { paddingY: "sm" } },
        ],
      },
    },
  });

  expect(
    propsAt(document, ["components", "card", "children", "0", "props"]),
  ).toEqual({ paddingTop: "sm", paddingBottom: "sm" });
});

test("入れ子の奥にあるノードまで読み替えが届く", () => {
  const document = setupArtboard({
    children: [
      {
        name: "outer",
        type: "Box",
        children: [{ name: "inner", type: "Box", props: { paddingX: "xs" } }],
      },
    ],
  });

  expect(
    propsAt(document, [
      "artboards",
      "0",
      "children",
      "0",
      "children",
      "0",
      "props",
    ]),
  ).toEqual({ paddingLeft: "xs", paddingRight: "xs" });
});

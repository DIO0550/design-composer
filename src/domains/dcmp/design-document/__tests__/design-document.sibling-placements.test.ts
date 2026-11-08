import { expect, test } from "vitest";
import type { SiblingPlacements } from "@/domains/dcmp/sibling-placements";
import type { NonEmptyArray } from "@/types/NonEmptyArray";
import { Option } from "@/utils/Option";
import { DesignDocument, DocumentTemplate } from "../index";

/**
 * `home` の下に絶対配置の `a`・`b`、フローの `flowing`、部品 `primary-button` のインスタンス
 * `login`、Box の `group`。`group` の中に絶対配置の `inner`。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "a",
            type: "Box",
            props: { placement: "absolute", x: 10, y: 20 },
          },
          {
            name: "b",
            type: "Box",
            props: { placement: "absolute", x: 30, y: 40 },
          },
          { name: "flowing", type: "Box" },
          { name: "login", ref: "primary-button" },
          {
            name: "group",
            type: "Box",
            children: [
              {
                name: "inner",
                type: "Box",
                props: { placement: "absolute", x: 5, y: 6 },
              },
            ],
          },
        ],
      },
    ],
  });
}

function siblingsOf(names: NonEmptyArray<string>): Option<SiblingPlacements> {
  return DesignDocument.findSiblingPlacements(setupDocument(), names);
}

test("同じ親の絶対配置の兄弟を逆順に渡しても、親と各自の座標がツリー順に返る", () => {
  expect(Option.unwrap(siblingsOf(["b", "a"]))).toEqual({
    parentName: "home",
    members: [
      { name: "a", placement: { mode: "absolute", x: 10, y: 20 } },
      { name: "b", placement: { mode: "absolute", x: 30, y: 40 } },
    ],
  });
});

test("同じ名前が 2 回渡されても、一員は 1 つにまとまる", () => {
  expect(Option.unwrap(siblingsOf(["a", "a"]))).toEqual({
    parentName: "home",
    members: [{ name: "a", placement: { mode: "absolute", x: 10, y: 20 } }],
  });
});

test("フローのノードが混ざると、兄弟の座標は無い", () => {
  expect(Option.isSome(siblingsOf(["a", "flowing"]))).toBe(false);
});

test("部品インスタンスが混ざると、兄弟の座標は無い", () => {
  expect(Option.isSome(siblingsOf(["a", "login"]))).toBe(false);
});

test("親の違う絶対配置のノードが混ざると、兄弟の座標は無い", () => {
  expect(Option.isSome(siblingsOf(["a", "inner"]))).toBe(false);
});

test("artboard が混ざると、兄弟の座標は無い", () => {
  expect(Option.isSome(siblingsOf(["a", "home"]))).toBe(false);
});

test("ドキュメントに無い名前が混ざると、兄弟の座標は無い", () => {
  expect(Option.isSome(siblingsOf(["a", "missing"]))).toBe(false);
});

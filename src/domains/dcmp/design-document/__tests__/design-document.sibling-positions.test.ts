import { expect, test } from "vitest";
import type { SiblingPositions } from "@/domains/dcmp/sibling-positions";
import type { NonEmptyArray } from "@/types/NonEmptyArray";
import { Result } from "@/utils/Result";
import { DesignDocument, type DesignDocumentEditError } from "../index";

/** home の下に a, b, group。group の子は inner-1, inner-2。 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          { name: "a", type: "Box" },
          { name: "b", type: "Box" },
          {
            name: "group",
            type: "Box",
            children: [
              { name: "inner-1", type: "Box" },
              { name: "inner-2", type: "Box" },
            ],
          },
        ],
      },
    ],
  });
}

function siblingsOf(
  names: NonEmptyArray<string>,
): Result<SiblingPositions, DesignDocumentEditError> {
  return DesignDocument.findSiblingPositions(setupDocument(), names);
}

test("同じ親の兄弟を前面にいるものから渡しても、親と背面から順の位置が返る", () => {
  expect(Result.unwrap(siblingsOf(["group", "a"]))).toEqual({
    parentName: "home",
    indices: [0, 2],
  });
});

test("親が違うノードを渡すと different-parents になる", () => {
  expect(siblingsOf(["a", "inner-1"])).toStrictEqual(
    Result.err({ kind: "different-parents" }),
  );
});

test("artboard とその子を渡すと、artboard の名前の node-not-found になる", () => {
  expect(siblingsOf(["home", "a"])).toStrictEqual(
    Result.err({ kind: "node-not-found", name: "home" }),
  );
});

test("ドキュメントに無い名前と親の違うノードが同時に混ざると、無い名前の node-not-found になる", () => {
  expect(siblingsOf(["inner-1", "missing", "a"])).toStrictEqual(
    Result.err({ kind: "node-not-found", name: "missing" }),
  );
});

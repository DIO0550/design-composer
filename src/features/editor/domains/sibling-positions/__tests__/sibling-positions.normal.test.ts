import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { Option } from "@/utils/Option";
import { SiblingPositions } from "../index";

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

function siblingsOf(names: readonly string[]): Option<SiblingPositions> {
  return SiblingPositions.fromSelection(
    DocumentSelection.fromNames(setupDocument(), names),
  );
}

test("同じ親の兄弟を前面にいるものから選んでも、親と、背面から順の位置が返る", () => {
  expect(Option.unwrap(siblingsOf(["group", "a"]))).toEqual({
    parentName: "home",
    indices: [0, 2],
  });
});

test("親が違うノードを選んでいると、兄弟の位置は無い", () => {
  expect(Option.isSome(siblingsOf(["a", "inner-1"]))).toBe(false);
});

test("artboard とその子を選んでいると、兄弟の位置は無い", () => {
  expect(Option.isSome(siblingsOf(["home", "a"]))).toBe(false);
});

test("何も選んでいなければ、兄弟の位置は無い", () => {
  expect(Option.isSome(siblingsOf([]))).toBe(false);
});

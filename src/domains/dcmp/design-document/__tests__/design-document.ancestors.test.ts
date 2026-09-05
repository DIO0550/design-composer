import { expect, test } from "vitest";
import { DesignDocument } from "../index";

/**
 * `home` の直下に `badge` があり、`card` の中に `card-badge` が入っているドキュメント。
 *
 * 深さの違う 2 つを同じ木に置くのは、答えが「artboard 1 つ」で固定されていないことを
 * 1 つの前提で見られるようにするため。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          { name: "badge", type: "Text", props: { content: "3" } },
          {
            name: "card",
            type: "Box",
            props: {},
            children: [{ name: "card-badge", type: "Text", props: {} }],
          },
        ],
      },
    ],
  });
}

test("artboard の直下にあるノードを包んでいるのは、その artboard だけ", () => {
  expect(DesignDocument.collectAncestorNames(setupDocument(), "badge")).toEqual(
    ["home"],
  );
});

test("入れ子のノードを包んでいるものは、内側から外側の順に並ぶ", () => {
  expect(
    DesignDocument.collectAncestorNames(setupDocument(), "card-badge"),
  ).toEqual(["card", "home"]);
});

test("artboard 自身は誰にも包まれていない", () => {
  expect(DesignDocument.collectAncestorNames(setupDocument(), "home")).toEqual(
    [],
  );
});

test("ドキュメントに無い名前は包んでいるものを持たない", () => {
  expect(
    DesignDocument.collectAncestorNames(setupDocument(), "居ない"),
  ).toEqual([]);
});

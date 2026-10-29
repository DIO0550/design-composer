import { expect, test } from "vitest";
import type { Node } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";

/*
 * 同じ親の兄弟をまとめて Box で包む（docs/06-ui.md「複数選択」のグループ化）。ここで見るのは
 * 木の付け替えと成立しない相手で、Box が引き継ぐ指定は
 * `design-document.group-siblings-placement.test.ts` が持つ。
 */

/**
 * home の下に a, x, b, y, group（左が背面）。group の子は inner-1, inner-2。
 *
 * @returns そのドキュメント
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          { name: "a", type: "Text" },
          { name: "x", type: "Text" },
          { name: "b", type: "Text" },
          { name: "y", type: "Text" },
          {
            name: "group",
            type: "Box",
            children: [
              { name: "inner-1", type: "Text" },
              { name: "inner-2", type: "Text" },
            ],
          },
        ],
      },
    ],
  });
}

/**
 * 名前で指した artboard / ノードの子の名前。
 *
 * @param document 引き先のドキュメント
 * @param parentName 子を読みたい artboard / ノードの名前
 * @returns 子の名前を並び順のまま
 */
function childNames(
  document: DesignDocument,
  parentName: string,
): readonly string[] {
  return Option.unwrap(DesignDocument.findChildren(document, parentName)).map(
    (child: Node) => child.name,
  );
}

test("同じ親の兄弟を 2 つ包むと、いちばん前面にいたものの位置に新しい Box が入り、選んだものがその子になる", () => {
  const grouped = Result.unwrap(
    DesignDocument.groupIntoBox(setupDocument(), ["x", "b"], "box"),
  );

  expect([childNames(grouped, "home"), childNames(grouped, "box")]).toEqual([
    ["a", "box", "y", "group"],
    ["x", "b"],
  ]);
});

test("離れた兄弟を包むと、間にいた選んでいない兄弟は Box より背面側に残る", () => {
  const grouped = Result.unwrap(
    DesignDocument.groupIntoBox(setupDocument(), ["a", "b"], "box"),
  );

  expect(childNames(grouped, "home")).toEqual(["x", "box", "y", "group"]);
});

test("前面にいるものから順に名前を渡しても、Box の子は元の並び順になる", () => {
  const grouped = Result.unwrap(
    DesignDocument.groupIntoBox(setupDocument(), ["y", "a", "b"], "box"),
  );

  expect(childNames(grouped, "box")).toEqual(["a", "b", "y"]);
});

test("入れ子の中の兄弟も包める", () => {
  const grouped = Result.unwrap(
    DesignDocument.groupIntoBox(setupDocument(), ["inner-2", "inner-1"], "box"),
  );

  expect([childNames(grouped, "group"), childNames(grouped, "box")]).toEqual([
    ["box"],
    ["inner-1", "inner-2"],
  ]);
});

test("親が違うノードは包めない", () => {
  const document = setupDocument();

  expect([
    Result.isOk(DesignDocument.groupIntoBox(document, ["a"], "box")),
    Result.isOk(DesignDocument.groupIntoBox(document, ["inner-1"], "box")),
    DesignDocument.groupIntoBox(document, ["a", "inner-1"], "box"),
  ]).toStrictEqual([true, true, Result.err({ kind: "different-parents" })]);
});

test("artboard とその子は包めない", () => {
  expect(
    DesignDocument.groupIntoBox(setupDocument(), ["a", "home"], "box"),
  ).toStrictEqual(Result.err({ kind: "node-not-found", name: "home" }));
});

test("ドキュメントに無い名前が混ざると包めない", () => {
  expect(
    DesignDocument.groupIntoBox(setupDocument(), ["a", "missing"], "box"),
  ).toStrictEqual(Result.err({ kind: "node-not-found", name: "missing" }));
});

test("既に使われている名前の Box では、兄弟をまとめて包めない", () => {
  expect(
    DesignDocument.groupIntoBox(setupDocument(), ["a", "b"], "group"),
  ).toStrictEqual(Result.err({ kind: "duplicate-name", name: "group" }));
});

test("識別子の規則を満たさない名前の Box では、兄弟をまとめて包めない", () => {
  expect(
    DesignDocument.groupIntoBox(setupDocument(), ["a", "b"], "Box 1"),
  ).toStrictEqual(Result.err({ kind: "invalid-name", name: "Box 1" }));
});

test("同じ名前を 2 回渡すと、そのノード 1 つを包んだのと同じになる", () => {
  const document = setupDocument();

  expect(
    DesignDocument.groupIntoBox(document, ["b", "b"], "box"),
  ).toStrictEqual(DesignDocument.groupIntoBox(document, ["b"], "box"));
});

test("隣り合うフローの兄弟を包んでから外すと、元の並びに戻る", () => {
  const document = setupDocument();
  const grouped = Result.unwrap(
    DesignDocument.groupIntoBox(document, ["x", "b"], "box"),
  );

  const { document: ungrouped } = Result.unwrap(
    DesignDocument.ungroupBox(grouped, "box"),
  );

  expect(ungrouped).toEqual(document);
});

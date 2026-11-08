import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { SiblingPlacements } from "@/domains/dcmp/sibling-placements";
import { DocumentSelection } from "@/domains/session/document-selection";
import { SelectionDigs } from "@/domains/session/selection-dig";
import { UnderPointer } from "@/domains/session/under-pointer";
import { Option } from "@/utils/Option";

/**
 * キャンバスで選んでいるものの一員を押して掴むと、全員をまとめて運ぶか（docs/06-ui.md
 * 「キャンバス直接操作」の移動）。
 *
 * `home` の直下に Box の `outer`、その中に Box の `group`。`group` の中に絶対配置の Box の
 * `a`（中に Text の `a-label`）と `b`、フローの Box の `flowing`、ロックした絶対配置の
 * `sealed`、非表示の絶対配置の `ghost`。`home` の直下には絶対配置の `stray` もいる。
 */
function setupDocument(): DesignDocument {
  const absolute = { placement: "absolute", x: 0, y: 0 } as const;
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "outer",
            type: "Box",
            children: [
              {
                name: "group",
                type: "Box",
                children: [
                  {
                    name: "a",
                    type: "Box",
                    props: absolute,
                    children: [{ name: "a-label", type: "Text" }],
                  },
                  { name: "b", type: "Box", props: absolute },
                  { name: "flowing", type: "Box" },
                  {
                    name: "sealed",
                    type: "Box",
                    props: { ...absolute, locking: "locked" },
                  },
                  {
                    name: "ghost",
                    type: "Box",
                    props: { ...absolute, visibility: "hidden" },
                  },
                ],
              },
            ],
          },
          { name: "stray", type: "Box", props: absolute },
        ],
      },
    ],
  });
}

/** 名前で選んだ状態で、その位置を押して掴んだときにまとめて運ぶ一員の名前。 */
function carriedNamesAt(
  selectedNames: readonly string[],
  underPointer: UnderPointer,
): Option<readonly string[]> {
  return Option.map(
    DocumentSelection.carriedSiblingsAt(
      DocumentSelection.fromNames(setupDocument(), selectedNames),
      underPointer,
    ),
    SiblingPlacements.names,
  );
}

const OnB = ["b", "group", "outer", "home"] as const;
const OnALabel = ["a-label", "a", "group", "outer", "home"] as const;

test("絶対配置の兄弟を選んで一員を押すと、全員をまとめて運ぶ", () => {
  const carried = carriedNamesAt(
    ["a", "b"],
    UnderPointer.create(OnB, SelectionDigs.NoDeeper),
  );

  expect(carried).toEqual(Option.some(["a", "b"]));
});

test("入れ子の一員の内側を押しても、全員をまとめて運ぶ", () => {
  const carried = carriedNamesAt(
    ["a", "b"],
    UnderPointer.create(OnALabel, SelectionDigs.NoDeeper),
  );

  expect(carried).toEqual(Option.some(["a", "b"]));
});

test("選択の外を押すと、まとめて運ばない", () => {
  const carried = carriedNamesAt(
    ["a", "b"],
    UnderPointer.create(
      ["flowing", "group", "outer", "home"],
      SelectionDigs.NoDeeper,
    ),
  );

  expect(Option.isSome(carried)).toBe(false);
});

test("1 つだけ選んでいるときは、まとめて運ばない", () => {
  const carried = carriedNamesAt(
    ["b"],
    UnderPointer.create(OnB, SelectionDigs.NoDeeper),
  );

  expect(Option.isSome(carried)).toBe(false);
});

test("フローのノードが混ざっていると、まとめて運ばない", () => {
  const carried = carriedNamesAt(
    ["b", "flowing"],
    UnderPointer.create(OnB, SelectionDigs.NoDeeper),
  );

  expect(Option.isSome(carried)).toBe(false);
});

test("親の違うノードが混ざっていると、まとめて運ばない", () => {
  const carried = carriedNamesAt(
    ["b", "stray"],
    UnderPointer.create(OnB, SelectionDigs.NoDeeper),
  );

  expect(Option.isSome(carried)).toBe(false);
});

test("ロック中の一員がいると、まとめて運ばない", () => {
  const carried = carriedNamesAt(
    ["b", "sealed"],
    UnderPointer.create(OnB, SelectionDigs.NoDeeper),
  );

  expect(Option.isSome(carried)).toBe(false);
});

test("非表示の一員がいると、まとめて運ばない", () => {
  const carried = carriedNamesAt(
    ["b", "ghost"],
    UnderPointer.create(OnB, SelectionDigs.NoDeeper),
  );

  expect(Option.isSome(carried)).toBe(false);
});

test("⌘ で一員の中の子を押すと、まとめて運ばない", () => {
  const carried = carriedNamesAt(
    ["a", "b"],
    UnderPointer.create(OnALabel, SelectionDigs.Deepest),
  );

  expect(Option.isSome(carried)).toBe(false);
});

test("⌘ で押した位置のいちばん内側が一員そのものなら、全員をまとめて運ぶ", () => {
  const carried = carriedNamesAt(
    ["a", "b"],
    UnderPointer.create(OnB, SelectionDigs.Deepest),
  );

  expect(carried).toEqual(Option.some(["a", "b"]));
});

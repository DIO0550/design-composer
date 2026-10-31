import { expect, test } from "vitest";
import { SelectionDigs } from "@/domains/session/selection-dig";
import { selectionDistanceTree } from "@/features/editor/features/canvas/__tests__/selection-distance-tree";
import { Pointing } from "@/features/editor/features/canvas/domains/pointing";
import { Option } from "@/utils/Option";
import { DistancePair } from "../index";

/*
 * 選択しているだけのときの Alt / Option の距離を測らないとき・相手にしないもの
 * （docs/06-ui.md「キャンバス直接操作」）。木の形は `selection-distance-tree` の doc。
 */

test("複数選択では、兄弟を指しても何も測らない", () => {
  const pair = DistancePair.create(
    selectionDistanceTree(["row", "title"]),
    Pointing.create(["chip", "card", "home"], SelectionDigs.NoDeeper),
  );

  expect(pair).toEqual(Option.none);
});

test("artboard を選んでいるときは、何も測らない", () => {
  const pair = DistancePair.create(
    selectionDistanceTree(["home"]),
    Pointing.create(["title", "home"], SelectionDigs.NoDeeper),
  );

  expect(pair).toEqual(Option.none);
});

test("何も選んでいないときは、何も測らない", () => {
  const pair = DistancePair.create(
    selectionDistanceTree([]),
    Pointing.create(["title", "home"], SelectionDigs.NoDeeper),
  );

  expect(pair).toEqual(Option.none);
});

test("ロック中の兄弟を指しても、その兄弟は相手にならない", () => {
  // ロックを見なければ `sealed` との横並びになる
  const pair = DistancePair.create(
    selectionDistanceTree(["row"]),
    Pointing.create(["sealed", "card", "home"], SelectionDigs.NoDeeper),
  );

  expect(pair).toEqual(
    Option.some({ kind: "within", inner: "row", outer: "card" }),
  );
});

test("⌘ を押してロック中のノードの中を指すと、そのすぐ外側のノードを相手にする", () => {
  const pair = DistancePair.create(
    selectionDistanceTree(["row"]),
    Pointing.create(
      ["sealed-mark", "sealed", "card", "home"],
      SelectionDigs.Deepest,
    ),
  );

  expect(pair).toEqual(
    Option.some({ kind: "within", inner: "row", outer: "card" }),
  );
});

import { expect, test } from "vitest";
import { SelectionDigs } from "@/domains/session/selection-dig";
import { selectionDistanceTree } from "@/features/editor/features/canvas/__tests__/selection-distance-tree";
import { Pointing } from "@/features/editor/features/canvas/domains/pointing";
import { Option } from "@/utils/Option";
import { DistancePair } from "../index";

/*
 * 選択しているだけのときの Alt / Option の距離で、何と何を測るか（docs/06-ui.md「キャンバス
 * 直接操作」）。木の形は `selection-distance-tree` の doc。
 */

test("選択の内側を指すと、選択から親の内側の縁までを測る", () => {
  const pair = DistancePair.create(
    selectionDistanceTree(["row"]),
    Pointing.create(
      ["label", "cell", "row", "card", "home"],
      SelectionDigs.NoDeeper,
    ),
  );

  expect(pair).toEqual(
    Option.some({ kind: "within", inner: "row", outer: "card" }),
  );
});

test("兄弟を指すと、兄弟との横並びを測る", () => {
  const pair = DistancePair.create(
    selectionDistanceTree(["row"]),
    Pointing.create(["chip", "card", "home"], SelectionDigs.NoDeeper),
  );

  expect(pair).toEqual(
    Option.some({ kind: "beside", from: "row", to: "chip" }),
  );
});

test("兄弟の子を指しても、兄弟との横並びを測る", () => {
  const pair = DistancePair.create(
    selectionDistanceTree(["row"]),
    Pointing.create(
      ["chip-icon", "chip", "card", "home"],
      SelectionDigs.NoDeeper,
    ),
  );

  expect(pair).toEqual(
    Option.some({ kind: "beside", from: "row", to: "chip" }),
  );
});

test("⌘ を押して選択の内側を指すと、いちばん内側の子孫から選択の内側の縁までを測る", () => {
  const pair = DistancePair.create(
    selectionDistanceTree(["row"]),
    Pointing.create(
      ["label", "cell", "row", "card", "home"],
      SelectionDigs.Deepest,
    ),
  );

  expect(pair).toEqual(
    Option.some({ kind: "within", inner: "label", outer: "row" }),
  );
});

test("⌘ を押して兄弟の子を指すと、その子との横並びを測る", () => {
  const pair = DistancePair.create(
    selectionDistanceTree(["row"]),
    Pointing.create(
      ["chip-icon", "chip", "card", "home"],
      SelectionDigs.Deepest,
    ),
  );

  expect(pair).toEqual(
    Option.some({ kind: "beside", from: "row", to: "chip-icon" }),
  );
});

test("深さ 3 のノードを選んで親の背景を指すと、クリックの規則どおり artboard 直下の祖先の内側の縁までを測る", () => {
  // 親（`row`）の縁とは答えが違う
  const pair = DistancePair.create(
    selectionDistanceTree(["cell"]),
    Pointing.create(["row", "card", "home"], SelectionDigs.NoDeeper),
  );

  expect(pair).toEqual(
    Option.some({ kind: "within", inner: "cell", outer: "card" }),
  );
});

test("別の枝のノードを指すと、そのノードとの横並びを測る", () => {
  const pair = DistancePair.create(
    selectionDistanceTree(["row"]),
    Pointing.create(["title", "home"], SelectionDigs.NoDeeper),
  );

  expect(pair).toEqual(
    Option.some({ kind: "beside", from: "row", to: "title" }),
  );
});

test("深さ 2 のノードを選んで自分の artboard の背景を指すと、artboard の内側の縁までを測る", () => {
  const pair = DistancePair.create(
    selectionDistanceTree(["row"]),
    Pointing.create(["home"], SelectionDigs.NoDeeper),
  );

  expect(pair).toEqual(
    Option.some({ kind: "within", inner: "row", outer: "home" }),
  );
});

test("深さ 2 のノードを選んで別の artboard のノードを指すと、親の内側の縁までを測る", () => {
  const pair = DistancePair.create(
    selectionDistanceTree(["row"]),
    Pointing.create(["slot", "settings"], SelectionDigs.NoDeeper),
  );

  expect(pair).toEqual(
    Option.some({ kind: "within", inner: "row", outer: "card" }),
  );
});

test("artboard の枠の外を指すと、親の内側の縁までを測る", () => {
  const pair = DistancePair.create(
    selectionDistanceTree(["row"]),
    Pointing.Nothing,
  );

  expect(pair).toEqual(
    Option.some({ kind: "within", inner: "row", outer: "card" }),
  );
});

test("キャンバスの外を指していると、何も測らない", () => {
  const pair = DistancePair.create(
    selectionDistanceTree(["row"]),
    Pointing.Outside,
  );

  expect(pair).toEqual(Option.none);
});

test("artboard 直下のノードの親は artboard になる", () => {
  const pair = DistancePair.create(
    selectionDistanceTree(["title"]),
    Pointing.Nothing,
  );

  expect(pair).toEqual(
    Option.some({ kind: "within", inner: "title", outer: "home" }),
  );
});

test("同じ 2 つを測る組は、等しい", () => {
  const isEqual = DistancePair.equals(
    { kind: "beside", from: "row", to: "chip" },
    { kind: "beside", from: "row", to: "chip" },
  );

  expect(isEqual).toBe(true);
});

test("相手が 1 つでも違えば、等しくない", () => {
  const isEqual = DistancePair.equals(
    { kind: "beside", from: "row", to: "chip" },
    { kind: "beside", from: "row", to: "title" },
  );

  expect(isEqual).toBe(false);
});

test("同じ名前でも、組の種類が違えば等しくない", () => {
  const isEqual = DistancePair.equals(
    { kind: "within", inner: "row", outer: "card" },
    { kind: "beside", from: "row", to: "card" },
  );

  expect(isEqual).toBe(false);
});

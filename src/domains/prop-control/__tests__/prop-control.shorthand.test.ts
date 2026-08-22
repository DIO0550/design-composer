import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import type { Props } from "@/domains/node";
import { SidePairs, Sides } from "@/domains/side";
import { Option } from "@/utils/Option";
import {
  PropControl,
  type PropControlRow,
  PropPairControl,
  PropShorthandControl,
} from "../index";
import { resolvedValueOfControl, sectionsOf } from "./setup";

/**
 * Box を 1 つ選んだ状態。
 *
 * @param props その Box に設定する props
 * @returns その Box を選んでいるドキュメントと選択の対
 */
function setupSelection(props: Props): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [{ name: "box", type: "Box", props }],
        },
      ],
    }),
    ["box"],
  );
}

/** Layout セクションの行。セクションが無ければテストを落とす。 */
function layoutRows(selection: DocumentSelection): readonly PropControlRow[] {
  const layout = sectionsOf(selection).find(
    (section) => section.group === "layout",
  );
  if (layout === undefined) {
    throw new Error("layout のセクションが無い");
  }
  return layout.rows;
}

/** padding を束ねた行。束ねられていなければテストを落とす。 */
function paddingRow(selection: DocumentSelection): PropShorthandControl {
  const row = layoutRows(selection).find(
    (candidate) =>
      candidate.kind === "shorthand" && candidate.shorthand.name === "padding",
  );
  if (row === undefined || row.kind !== "shorthand") {
    throw new Error("padding が束ねた行として出ていない");
  }
  return row.shorthand;
}

/** 畳んだ欄のうち垂直のもの。 */
function verticalPair(selection: DocumentSelection): PropPairControl {
  const [vertical] = PropShorthandControl.pairs(paddingRow(selection));
  return vertical;
}

/** 4 辺とも同じ値。畳んだ欄が揃っている状態の出発点。 */
const UniformSides = {
  paddingTop: "sm",
  paddingRight: "sm",
  paddingBottom: "sm",
  paddingLeft: "sm",
} as const;

test("辺を宣言した prop は束ねた行にまとまり、辺ごとの行としては出ない", () => {
  const rows = layoutRows(setupSelection(UniformSides));

  expect(
    rows.flatMap((row) => (row.kind === "prop" ? [row.control.prop] : [])),
  ).toEqual(["direction", "gap", "align", "justify"]);
});

test("束ねた行はセクション内で最初の辺の位置に出る", () => {
  const rows = layoutRows(setupSelection(UniformSides));

  expect(
    rows.map((row) =>
      row.kind === "prop" ? row.control.prop : row.shorthand.name,
    ),
  ).toEqual(["direction", "gap", "padding", "align", "justify"]);
});

test("束ねた行は 4 辺を上 右 下 左の順に持つ", () => {
  const sides = PropShorthandControl.sides(
    paddingRow(setupSelection(UniformSides)),
  );

  expect(sides.map((side) => [side.side, side.control.prop])).toEqual([
    [Sides.Top, "paddingTop"],
    [Sides.Right, "paddingRight"],
    [Sides.Bottom, "paddingBottom"],
    [Sides.Left, "paddingLeft"],
  ]);
});

test("畳んだ欄は垂直 水平の順に並ぶ", () => {
  const pairs = PropShorthandControl.pairs(
    paddingRow(setupSelection(UniformSides)),
  );

  expect(pairs.map((pair) => pair.pair)).toEqual([
    SidePairs.Vertical,
    SidePairs.Horizontal,
  ]);
});

test("畳んだ欄は向かい合う 2 辺だけを書き込み先に持つ", () => {
  const [vertical, horizontal] = PropShorthandControl.pairs(
    paddingRow(setupSelection(UniformSides)),
  );

  expect(
    [vertical, horizontal].map((pair) => pair.sides.map((s) => s.prop)),
  ).toEqual([
    ["paddingTop", "paddingBottom"],
    ["paddingRight", "paddingLeft"],
  ]);
});

test("向かい合う 2 辺が同じ値なら畳んだ欄はその値になる", () => {
  const selection = setupSelection({
    ...UniformSides,
    paddingTop: "md",
    paddingBottom: "md",
  });

  expect(PropPairControl.value(verticalPair(selection))).toEqual({
    kind: "uniform",
    value: Option.some("md"),
  });
});

test("向かい合う 2 辺が違う値なら畳んだ欄は不揃いになる", () => {
  const selection = setupSelection({ ...UniformSides, paddingTop: "md" });

  expect(PropPairControl.value(verticalPair(selection))).toEqual({
    kind: "mixed",
  });
});

test("向かい合う 2 辺がどちらも未設定なら畳んだ欄は不揃いではなく未設定になる", () => {
  /* 左右は揃った値を入れておく。垂直だけを見ていることを確かめるため。 */
  const selection = setupSelection({ paddingRight: "sm", paddingLeft: "sm" });

  expect(PropPairControl.value(verticalPair(selection))).toEqual({
    kind: "uniform",
    value: Option.none,
  });
});

test("向かい合う 2 辺の片方だけが設定されていれば畳んだ欄は不揃いになる", () => {
  const selection = setupSelection({ paddingTop: "md" });

  expect(PropPairControl.value(verticalPair(selection))).toEqual({
    kind: "mixed",
  });
});

test("畳んだ欄が揃っていれば辺と同じ解決値を持つ", () => {
  const selection = setupSelection(UniformSides);
  const input = PropPairControl.input(verticalPair(selection));
  const [top] = PropShorthandControl.sides(paddingRow(selection));

  expect(
    input.kind === "numericToken" ? input.resolvedValue : Option.none,
  ).toEqual(resolvedValueOfControl(top.control));
});

test("畳んだ欄が不揃いのときは解決値を持たない", () => {
  /* 上辺は実在するトークンを指したままにする（辺の側は解決値を持つ）。 */
  const selection = setupSelection({ ...UniformSides, paddingTop: "md" });
  const input = PropPairControl.input(verticalPair(selection));

  expect(
    input.kind === "numericToken" ? input.resolvedValue : Option.none,
  ).toEqual(Option.none);
});

test("畳んだ欄を編集すると向かい合う 2 辺を同じ値にする 1 件の編集になる", () => {
  const selection = setupSelection(UniformSides);

  expect(
    PropPairControl.editFrom(verticalPair(selection), Option.some("lg")),
  ).toEqual({
    names: ["paddingTop", "paddingBottom"],
    value: Option.some("lg"),
  });
});

test("畳んだ欄に値が無いときは向かい合う 2 辺を未設定へ戻す 1 件の編集になる", () => {
  const selection = setupSelection(UniformSides);

  expect(
    PropPairControl.editFrom(verticalPair(selection), Option.none),
  ).toEqual({
    names: ["paddingTop", "paddingBottom"],
    value: Option.none,
  });
});

test("辺の欄を編集するとその辺だけを指す 1 件の編集になる", () => {
  const [top] = PropShorthandControl.sides(
    paddingRow(setupSelection(UniformSides)),
  );

  expect(PropControl.editFrom(top.control, Option.some("lg"))).toEqual({
    names: ["paddingTop"],
    value: Option.some("lg"),
  });
});

test("4 辺が揃っていない並びからは束ねた行を作れない", () => {
  const [top, right, bottom] = PropShorthandControl.sides(
    paddingRow(setupSelection(UniformSides)),
  );

  expect(PropShorthandControl.create("padding", [top, right, bottom])).toEqual(
    Option.none,
  );
});

test("同じ辺が 2 つ来る並びからは束ねた行を作れない", () => {
  const [top, right, bottom, left] = PropShorthandControl.sides(
    paddingRow(setupSelection(UniformSides)),
  );

  expect(
    PropShorthandControl.create("padding", [top, right, bottom, left, left]),
  ).toEqual(Option.none);
});

test("4 辺が揃った並びからは束ねた行を作れる", () => {
  const sides = PropShorthandControl.sides(
    paddingRow(setupSelection(UniformSides)),
  );

  expect(PropShorthandControl.create("padding", sides).some).toBe(true);
});

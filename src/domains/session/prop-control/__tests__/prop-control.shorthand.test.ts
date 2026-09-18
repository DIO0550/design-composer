import { expect, test } from "vitest";
import type { DocumentSelection } from "@/domains/session/document-selection";
import { Corners } from "@/domains/unit/corner";
import { SidePairs, Sides } from "@/domains/unit/side";
import { Option } from "@/utils/Option";
import {
  PropCollapsedControl,
  PropControl,
  type PropControlRow,
  type PropShorthandControl,
  PropShorthandControl as Shorthand,
} from "../index";
import { boxSelection, resolvedValueOfControl, sectionsOf } from "./setup";

/** 指定した group のセクションの行。セクションが無ければテストを落とす。 */
function rowsOfGroup(
  selection: DocumentSelection,
  group: string,
): readonly PropControlRow[] {
  const section = sectionsOf(selection).find(
    (candidate) => candidate.group === group,
  );
  if (section === undefined) {
    throw new Error(`${group} のセクションが無い`);
  }
  return section.rows;
}

/** 名前で引いた束ねた行。束ねられていなければテストを落とす。 */
function shorthandRow(
  selection: DocumentSelection,
  name: string,
): PropShorthandControl {
  const row = rowsOfGroup(
    selection,
    name === "padding" ? "layout" : "appearance",
  ).find(
    (candidate) =>
      candidate.kind === "shorthand" && candidate.shorthand.name === name,
  );
  if (row === undefined || row.kind !== "shorthand") {
    throw new Error(`${name} が束ねた行として出ていない`);
  }
  return row.shorthand;
}

/** 畳んだ欄のうち垂直のもの。 */
function verticalPair(selection: DocumentSelection): PropCollapsedControl {
  const [vertical] = Shorthand.collapsed(shorthandRow(selection, "padding"));
  return vertical;
}

/** radius の畳んだ 1 欄。 */
function allCornersCell(selection: DocumentSelection): PropCollapsedControl {
  const [allCorners] = Shorthand.collapsed(shorthandRow(selection, "radius"));
  return allCorners;
}

/** 4 辺とも同じ値。畳んだ欄が揃っている状態の出発点。 */
const UniformSides = {
  paddingTop: "sm",
  paddingRight: "sm",
  paddingBottom: "sm",
  paddingLeft: "sm",
} as const;

/** 4 隅とも同じ値。畳んだ欄が揃っている状態の出発点。 */
const UniformCorners = {
  radiusTopLeft: "sm",
  radiusTopRight: "sm",
  radiusBottomRight: "sm",
  radiusBottomLeft: "sm",
} as const;

test("辺を宣言した prop は束ねた行にまとまり、辺ごとの行としては出ない", () => {
  const rows = rowsOfGroup(boxSelection(UniformSides), "layout");

  expect(
    rows.flatMap((row) => (row.kind === "prop" ? [row.control.prop] : [])),
  ).toEqual(["placement", "rotation", "layout", "gap", "align", "justify"]);
});

test("隅を宣言した prop は束ねた行にまとまり、隅ごとの行としては出ない", () => {
  const rows = rowsOfGroup(boxSelection(UniformCorners), "appearance");

  expect(
    rows.flatMap((row) => (row.kind === "prop" ? [row.control.prop] : [])),
  ).toEqual(["background", "shadow", "overflow", "opacity", "visibility"]);
});

test("束ねた行はセクション内で最初の辺の位置に出る", () => {
  const rows = rowsOfGroup(boxSelection(UniformSides), "layout");

  expect(
    rows.map((row) =>
      row.kind === "prop" ? row.control.prop : row.shorthand.name,
    ),
  ).toEqual([
    "placement",
    "rotation",
    "layout",
    "gap",
    "padding",
    "align",
    "justify",
  ]);
});

test("束ねた行はセクション内で最初の隅の位置に出る", () => {
  const rows = rowsOfGroup(boxSelection(UniformCorners), "appearance");

  expect(
    rows.map((row) =>
      row.kind === "prop" ? row.control.prop : row.shorthand.name,
    ),
  ).toEqual([
    "background",
    "radius",
    "shadow",
    "overflow",
    "opacity",
    "visibility",
  ]);
});

test("束ねた行は 4 辺を上 右 下 左の順に持つ", () => {
  const longhands = Shorthand.longhands(
    shorthandRow(boxSelection(UniformSides), "padding"),
  );

  expect(
    longhands.map((longhand) => [
      longhand.kind === "side" ? longhand.side : longhand.corner,
      longhand.control.prop,
    ]),
  ).toEqual([
    [Sides.Top, "paddingTop"],
    [Sides.Right, "paddingRight"],
    [Sides.Bottom, "paddingBottom"],
    [Sides.Left, "paddingLeft"],
  ]);
});

test("束ねた行は 4 隅を 左上 右上 右下 左下の順に持つ", () => {
  const longhands = Shorthand.longhands(
    shorthandRow(boxSelection(UniformCorners), "radius"),
  );

  expect(
    longhands.map((longhand) => [
      longhand.kind === "corner" ? longhand.corner : longhand.side,
      longhand.control.prop,
    ]),
  ).toEqual([
    [Corners.TopLeft, "radiusTopLeft"],
    [Corners.TopRight, "radiusTopRight"],
    [Corners.BottomRight, "radiusBottomRight"],
    [Corners.BottomLeft, "radiusBottomLeft"],
  ]);
});

test("畳んだ欄は垂直 水平の順に並ぶ", () => {
  const collapsed = Shorthand.collapsed(
    shorthandRow(boxSelection(UniformSides), "padding"),
  );

  expect(
    collapsed.map((cell) => (cell.kind === "sidePair" ? cell.pair : cell.kind)),
  ).toEqual([SidePairs.Vertical, SidePairs.Horizontal]);
});

test("畳んだ欄は向かい合う 2 辺だけを書き込み先に持つ", () => {
  const collapsed = Shorthand.collapsed(
    shorthandRow(boxSelection(UniformSides), "padding"),
  );

  expect(
    collapsed.map((cell) => cell.controls.map((control) => control.prop)),
  ).toEqual([
    ["paddingTop", "paddingBottom"],
    ["paddingRight", "paddingLeft"],
  ]);
});

test("radius の畳んだ欄は 1 つで、4 隅すべてを書き込み先に持つ", () => {
  const collapsed = Shorthand.collapsed(
    shorthandRow(boxSelection(UniformCorners), "radius"),
  );

  expect(
    collapsed.map((cell) => cell.controls.map((control) => control.prop)),
  ).toEqual([
    [
      "radiusTopLeft",
      "radiusTopRight",
      "radiusBottomRight",
      "radiusBottomLeft",
    ],
  ]);
});

test("向かい合う 2 辺が同じ値なら畳んだ欄はその値になる", () => {
  const selection = boxSelection({
    ...UniformSides,
    paddingTop: "md",
    paddingBottom: "md",
  });

  expect(PropCollapsedControl.value(verticalPair(selection))).toEqual({
    kind: "uniform",
    value: Option.some("md"),
  });
});

test("4 隅が同じ値なら畳んだ欄はその値になる", () => {
  const selection = boxSelection({
    radiusTopLeft: "md",
    radiusTopRight: "md",
    radiusBottomRight: "md",
    radiusBottomLeft: "md",
  });

  expect(PropCollapsedControl.value(allCornersCell(selection))).toEqual({
    kind: "uniform",
    value: Option.some("md"),
  });
});

test("向かい合う 2 辺が違う値なら畳んだ欄は不揃いになる", () => {
  const selection = boxSelection({ ...UniformSides, paddingTop: "md" });

  expect(PropCollapsedControl.value(verticalPair(selection))).toEqual({
    kind: "mixed",
  });
});

test("4 隅のうち 1 つだけ違う値なら畳んだ欄は不揃いになる", () => {
  const selection = boxSelection({
    ...UniformCorners,
    radiusBottomLeft: "md",
  });

  expect(PropCollapsedControl.value(allCornersCell(selection))).toEqual({
    kind: "mixed",
  });
});

test("向かい合う 2 辺がどちらも未設定なら畳んだ欄は不揃いではなく未設定になる", () => {
  /* 左右は揃った値を入れておく。垂直だけを見ていることを確かめるため。 */
  const selection = boxSelection({ paddingRight: "sm", paddingLeft: "sm" });

  expect(PropCollapsedControl.value(verticalPair(selection))).toEqual({
    kind: "uniform",
    value: Option.none,
  });
});

test("向かい合う 2 辺の片方だけが設定されていれば畳んだ欄は不揃いになる", () => {
  const selection = boxSelection({ paddingTop: "md" });

  expect(PropCollapsedControl.value(verticalPair(selection))).toEqual({
    kind: "mixed",
  });
});

test("畳んだ欄が揃っていれば辺と同じ解決値を持つ", () => {
  const selection = boxSelection(UniformSides);
  const input = PropCollapsedControl.input(verticalPair(selection));
  const [top] = Shorthand.longhands(shorthandRow(selection, "padding"));

  expect(
    input.kind === "numericToken" ? input.resolvedValue : Option.none,
  ).toEqual(resolvedValueOfControl(top.control));
});

test("畳んだ欄が不揃いのときは解決値を持たない", () => {
  /* 上辺は実在するトークンを指したままにする（辺の側は解決値を持つ）。 */
  const selection = boxSelection({ ...UniformSides, paddingTop: "md" });
  const input = PropCollapsedControl.input(verticalPair(selection));

  expect(
    input.kind === "numericToken" ? input.resolvedValue : Option.none,
  ).toEqual(Option.none);
});

test("畳んだ欄を編集すると向かい合う 2 辺を同じ値にする 1 件の編集になる", () => {
  const selection = boxSelection(UniformSides);

  expect(
    PropCollapsedControl.editFrom(verticalPair(selection), Option.some("lg")),
  ).toEqual({
    names: ["paddingTop", "paddingBottom"],
    value: Option.some("lg"),
  });
});

test("radius の畳んだ欄を編集すると 4 隅を同じ値にする 1 件の編集になる", () => {
  const selection = boxSelection(UniformCorners);

  expect(
    PropCollapsedControl.editFrom(allCornersCell(selection), Option.some("lg")),
  ).toEqual({
    names: [
      "radiusTopLeft",
      "radiusTopRight",
      "radiusBottomRight",
      "radiusBottomLeft",
    ],
    value: Option.some("lg"),
  });
});

test("畳んだ欄に値が無いときは向かい合う 2 辺を未設定へ戻す 1 件の編集になる", () => {
  const selection = boxSelection(UniformSides);

  expect(
    PropCollapsedControl.editFrom(verticalPair(selection), Option.none),
  ).toEqual({
    names: ["paddingTop", "paddingBottom"],
    value: Option.none,
  });
});

test("radius の畳んだ欄に値が無いときは 4 隅を未設定へ戻す 1 件の編集になる", () => {
  const selection = boxSelection(UniformCorners);

  expect(
    PropCollapsedControl.editFrom(allCornersCell(selection), Option.none),
  ).toEqual({
    names: [
      "radiusTopLeft",
      "radiusTopRight",
      "radiusBottomRight",
      "radiusBottomLeft",
    ],
    value: Option.none,
  });
});

test("辺の欄を編集するとその辺だけを指す 1 件の編集になる", () => {
  const [top] = Shorthand.longhands(
    shorthandRow(boxSelection(UniformSides), "padding"),
  );

  expect(PropControl.editFrom(top.control, Option.some("lg"))).toEqual({
    names: ["paddingTop"],
    value: Option.some("lg"),
  });
});

test("隅の欄を編集するとその隅だけを指す 1 件の編集になる", () => {
  const [topLeft] = Shorthand.longhands(
    shorthandRow(boxSelection(UniformCorners), "radius"),
  );

  expect(PropControl.editFrom(topLeft.control, Option.some("lg"))).toEqual({
    names: ["radiusTopLeft"],
    value: Option.some("lg"),
  });
});

test("4 辺が揃っていない並びからは束ねた行を作れない", () => {
  const [top, right, bottom] = Shorthand.longhands(
    shorthandRow(boxSelection(UniformSides), "padding"),
  );

  expect(Shorthand.create("padding", [top, right, bottom])).toEqual(
    Option.none,
  );
});

test("4 隅が揃っていない並びからは束ねた行を作れない", () => {
  const [topLeft, topRight, bottomRight] = Shorthand.longhands(
    shorthandRow(boxSelection(UniformCorners), "radius"),
  );

  expect(Shorthand.create("radius", [topLeft, topRight, bottomRight])).toEqual(
    Option.none,
  );
});

test("同じ辺が 2 つ来る並びからは束ねた行を作れない", () => {
  const [top, right, bottom, left] = Shorthand.longhands(
    shorthandRow(boxSelection(UniformSides), "padding"),
  );

  expect(Shorthand.create("padding", [top, right, bottom, left, left])).toEqual(
    Option.none,
  );
});

test("同じ隅が 2 つ来る並びからは束ねた行を作れない", () => {
  const corners = Shorthand.longhands(
    shorthandRow(boxSelection(UniformCorners), "radius"),
  );

  expect(Shorthand.create("radius", [...corners, corners[0]])).toEqual(
    Option.none,
  );
});

test("4 辺が揃った並びからは束ねた行を作れる", () => {
  const longhands = Shorthand.longhands(
    shorthandRow(boxSelection(UniformSides), "padding"),
  );

  expect(Option.isSome(Shorthand.create("padding", longhands))).toBe(true);
});

test("4 隅が揃った並びからは束ねた行を作れる", () => {
  const longhands = Shorthand.longhands(
    shorthandRow(boxSelection(UniformCorners), "radius"),
  );

  expect(Option.isSome(Shorthand.create("radius", longhands))).toBe(true);
});

test("辺の並びから radius の束ねた行は作れない", () => {
  const sides = Shorthand.longhands(
    shorthandRow(boxSelection(UniformSides), "padding"),
  );

  expect(Shorthand.create("radius", sides)).toEqual(Option.none);
});

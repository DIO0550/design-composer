import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import type { Props } from "@/domains/node";
import { SidePairs, Sides } from "@/domains/side";
import { EditorState } from "@/features/editor/domains/editor-state";
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
 * @returns その Box を選んでいるエディタの状態
 */
function setupState(props: Props): EditorState {
  return EditorState.select(
    EditorState.create(
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
    ),
    "box",
  );
}

/** Layout セクションの行。セクションが無ければテストを落とす。 */
function layoutRows(state: EditorState): readonly PropControlRow[] {
  const layout = sectionsOf(state).find(
    (section) => section.group === "layout",
  );
  if (layout === undefined) {
    throw new Error("layout のセクションが無い");
  }
  return layout.rows;
}

/** padding を束ねた行。束ねられていなければテストを落とす。 */
function paddingRow(state: EditorState): PropShorthandControl {
  const row = layoutRows(state).find(
    (candidate) =>
      candidate.kind === "shorthand" && candidate.shorthand.name === "padding",
  );
  if (row === undefined || row.kind !== "shorthand") {
    throw new Error("padding が束ねた行として出ていない");
  }
  return row.shorthand;
}

/** 畳んだ欄のうち垂直のもの。 */
function verticalPair(state: EditorState): PropPairControl {
  const [vertical] = PropShorthandControl.pairs(paddingRow(state));
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
  const rows = layoutRows(setupState(UniformSides));

  expect(
    rows.flatMap((row) => (row.kind === "prop" ? [row.control.prop] : [])),
  ).toEqual(["direction", "gap", "align", "justify"]);
});

test("束ねた行はセクション内で最初の辺の位置に出る", () => {
  const rows = layoutRows(setupState(UniformSides));

  expect(
    rows.map((row) =>
      row.kind === "prop" ? row.control.prop : row.shorthand.name,
    ),
  ).toEqual(["direction", "gap", "padding", "align", "justify"]);
});

test("束ねた行は 4 辺を上 右 下 左の順に持つ", () => {
  const sides = PropShorthandControl.sides(
    paddingRow(setupState(UniformSides)),
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
    paddingRow(setupState(UniformSides)),
  );

  expect(pairs.map((pair) => pair.pair)).toEqual([
    SidePairs.Vertical,
    SidePairs.Horizontal,
  ]);
});

test("畳んだ欄は向かい合う 2 辺だけを書き込み先に持つ", () => {
  const [vertical, horizontal] = PropShorthandControl.pairs(
    paddingRow(setupState(UniformSides)),
  );

  expect(
    [vertical, horizontal].map((pair) => pair.sides.map((s) => s.prop)),
  ).toEqual([
    ["paddingTop", "paddingBottom"],
    ["paddingRight", "paddingLeft"],
  ]);
});

test("向かい合う 2 辺が同じ値なら畳んだ欄はその値になる", () => {
  const state = setupState({
    ...UniformSides,
    paddingTop: "md",
    paddingBottom: "md",
  });

  expect(PropPairControl.value(verticalPair(state))).toEqual({
    kind: "uniform",
    value: Option.some("md"),
  });
});

test("向かい合う 2 辺が違う値なら畳んだ欄は不揃いになる", () => {
  const state = setupState({ ...UniformSides, paddingTop: "md" });

  expect(PropPairControl.value(verticalPair(state))).toEqual({ kind: "mixed" });
});

test("向かい合う 2 辺がどちらも未設定なら畳んだ欄は不揃いではなく未設定になる", () => {
  /* 左右は揃った値を入れておく。垂直だけを見ていることを確かめるため。 */
  const state = setupState({ paddingRight: "sm", paddingLeft: "sm" });

  expect(PropPairControl.value(verticalPair(state))).toEqual({
    kind: "uniform",
    value: Option.none,
  });
});

test("向かい合う 2 辺の片方だけが設定されていれば畳んだ欄は不揃いになる", () => {
  const state = setupState({ paddingTop: "md" });

  expect(PropPairControl.value(verticalPair(state))).toEqual({ kind: "mixed" });
});

test("畳んだ欄が揃っていれば辺と同じ解決値を持つ", () => {
  const state = setupState(UniformSides);
  const input = PropPairControl.input(verticalPair(state));
  const [top] = PropShorthandControl.sides(paddingRow(state));

  expect(
    input.kind === "numericToken" ? input.resolvedValue : Option.none,
  ).toEqual(resolvedValueOfControl(top.control));
});

test("畳んだ欄が不揃いのときは解決値を持たない", () => {
  /* 上辺は実在するトークンを指したままにする（辺の側は解決値を持つ）。 */
  const state = setupState({ ...UniformSides, paddingTop: "md" });
  const input = PropPairControl.input(verticalPair(state));

  expect(
    input.kind === "numericToken" ? input.resolvedValue : Option.none,
  ).toEqual(Option.none);
});

test("畳んだ欄を編集すると向かい合う 2 辺を同じ値にする 1 件の編集になる", () => {
  const state = setupState(UniformSides);

  expect(PropPairControl.editFrom(verticalPair(state), "lg")).toEqual({
    names: ["paddingTop", "paddingBottom"],
    value: Option.some("lg"),
  });
});

test("畳んだ欄を空にすると向かい合う 2 辺を未設定へ戻す 1 件の編集になる", () => {
  const state = setupState(UniformSides);

  expect(PropPairControl.editFrom(verticalPair(state), "")).toEqual({
    names: ["paddingTop", "paddingBottom"],
    value: Option.none,
  });
});

test("辺の欄を編集するとその辺だけを指す 1 件の編集になる", () => {
  const [top] = PropShorthandControl.sides(
    paddingRow(setupState(UniformSides)),
  );

  expect(PropControl.editFrom(top.control, "lg")).toEqual({
    names: ["paddingTop"],
    value: Option.some("lg"),
  });
});

test("4 辺が揃っていない並びからは束ねた行を作れない", () => {
  const [top, right, bottom] = PropShorthandControl.sides(
    paddingRow(setupState(UniformSides)),
  );

  expect(PropShorthandControl.create("padding", [top, right, bottom])).toEqual(
    Option.none,
  );
});

test("同じ辺が 2 つ来る並びからは束ねた行を作れない", () => {
  const [top, right, bottom, left] = PropShorthandControl.sides(
    paddingRow(setupState(UniformSides)),
  );

  expect(
    PropShorthandControl.create("padding", [top, right, bottom, left, left]),
  ).toEqual(Option.none);
});

test("4 辺が揃った並びからは束ねた行を作れる", () => {
  const sides = PropShorthandControl.sides(
    paddingRow(setupState(UniformSides)),
  );

  expect(PropShorthandControl.create("padding", sides).some).toBe(true);
});

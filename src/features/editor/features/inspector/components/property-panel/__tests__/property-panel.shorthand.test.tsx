import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import {
  pressedSegmentsOf,
  segmentOf,
} from "@/components/__tests__/segmented-controls";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import type { Props } from "@/domains/dcmp/node";
import { DocumentSelection } from "@/domains/session/document-selection";
import { ShorthandLabels } from "../index";
import { renderPanel } from "./setup";

/** padding の行の読み上げ名。セグメントも欄もこの器の中から引く。 */
const PaddingRow = "Padding";

/** radius の行の読み上げ名。 */
const RadiusRow = "Radius";

/** 畳んだ欄を出すセグメントの綴り。padding と radius で同じなので、器で絞らないと引けない。 */
const CollapsedSegment = ShorthandLabels.collapsed.padding;

/** padding の行で 4 辺を出すセグメントの綴り。 */
const PerEdgeSegment = ShorthandLabels.perLonghand.padding;

/** radius の行で 4 隅を出すセグメントの綴り。 */
const PerCornerSegment = ShorthandLabels.perLonghand.radius;

/** 4 隅とも同じ値。畳んだ欄が揃っている状態。 */
const UniformCorners = {
  radiusTopLeft: "sm",
  radiusTopRight: "sm",
  radiusBottomRight: "sm",
  radiusBottomLeft: "sm",
} as const;

/** 4 辺とも同じ値。畳んだ欄が揃っている状態。 */
const UniformSides = {
  paddingTop: "sm",
  paddingRight: "sm",
  paddingBottom: "sm",
  paddingLeft: "sm",
} as const;

/**
 * その props を持つ Box を選んだパネルを描画する。
 *
 * @param props Box に設定する props
 * @returns 操作に使うユーザ
 */
function renderBoxPanel(props: Props) {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [{ name: "box", type: "Box", props }],
      },
    ],
  });
  renderPanel(DocumentSelection.fromNames(document, ["box"]));
  return userEvent.setup();
}

test("padding は辺ごとの行ではなく 1 つの行にまとまる", () => {
  renderBoxPanel(UniformSides);

  /*
   * 畳んだ 2 欄が出て辺の欄が出ないことを 1 つの並びで見る。片方だけを見ると、
   * 束ねずに 4 行のまま出す実装でも「畳んだ欄が無い」側だけで通ってしまう。
   */
  expect(
    ["Padding Vertical", "Padding Horizontal", "Padding Top"].map(
      (name) => screen.queryAllByRole("combobox", { name }).length,
    ),
  ).toEqual([1, 1, 0]);
});

test("既定では垂直と水平の 2 欄が出る", () => {
  renderBoxPanel(UniformSides);

  expect(
    screen.getByRole("combobox", { name: "Padding Vertical" }),
  ).toBeDefined();
  expect(
    screen.getByRole("combobox", { name: "Padding Horizontal" }),
  ).toBeDefined();
});

test("既定では畳んだ欄のセグメントが選ばれた状態で出る", () => {
  renderBoxPanel(UniformSides);

  expect(pressedSegmentsOf(PaddingRow)).toEqual([CollapsedSegment]);
});

test("畳んだ欄には向かい合う 2 辺に効いている値が出る", () => {
  renderBoxPanel(UniformSides);

  expect(
    screen.getByRole("combobox", { name: "Padding Vertical" }),
  ).toHaveProperty("value", "sm");
});

test("向かい合う 2 辺の値が違うと畳んだ欄には解決値が添わない", () => {
  /*
   * 揃っている水平側が対照（`sm` → 8 が添う）。畳んだ欄の解決値を
   * 辺のものへ差し替えると、上辺の `md` の数値がここに出て落ちる。
   */
  renderBoxPanel({ ...UniformSides, paddingTop: "md" });

  expect(
    screen
      .getByRole("combobox", { name: "Padding Vertical" })
      .getAttribute("aria-describedby"),
  ).toBeNull();
  expect(
    screen.getByRole("combobox", {
      name: "Padding Horizontal",
      description: "8",
    }),
  ).toBeDefined();
});

test("辺ごとのセグメントを選ぶとそのセグメントだけが選ばれた状態になる", async () => {
  const user = renderBoxPanel(UniformSides);

  await user.click(segmentOf(PaddingRow, PerEdgeSegment));

  expect(pressedSegmentsOf(PaddingRow)).toEqual([PerEdgeSegment]);
});

test("向かい合う 2 辺の値が違うと畳んだ欄は不揃いと出る", () => {
  /* 左右は揃えておく。揃っている側にも不揃いが出れば落ちる。 */
  renderBoxPanel({ ...UniformSides, paddingTop: "md" });

  expect(screen.getAllByRole("option", { name: "不揃い" })).toHaveLength(1);
});

test("辺ごとのセグメントを選ぶと 4 辺の欄が出る", async () => {
  const user = renderBoxPanel(UniformSides);

  await user.click(segmentOf(PaddingRow, PerEdgeSegment));

  const edges = [
    "Padding Top",
    "Padding Right",
    "Padding Bottom",
    "Padding Left",
  ];
  expect(
    edges.filter((name) => screen.queryByRole("combobox", { name }) !== null),
  ).toEqual(edges);
});

test("4 辺の欄を出すと畳んだ欄は出なくなる", async () => {
  const user = renderBoxPanel(UniformSides);

  await user.click(segmentOf(PaddingRow, PerEdgeSegment));

  expect(
    screen.queryByRole("combobox", { name: "Padding Vertical" }),
  ).toBeNull();
});

test("選んでいる辺ごとのセグメントをもう一度押しても 4 辺の欄が出たままになる", async () => {
  /* トグルとの違い。押し直しで未選択へ落ちると畳んだ欄へ戻って落ちる。 */
  const user = renderBoxPanel(UniformSides);
  await user.click(segmentOf(PaddingRow, PerEdgeSegment));

  await user.click(segmentOf(PaddingRow, PerEdgeSegment));

  expect(screen.getByRole("combobox", { name: "Padding Top" })).toBeDefined();
});

test("畳んだ欄のセグメントを選ぶと畳んだ 2 欄へ戻る", async () => {
  const user = renderBoxPanel(UniformSides);
  await user.click(segmentOf(PaddingRow, PerEdgeSegment));

  await user.click(segmentOf(PaddingRow, CollapsedSegment));

  expect(
    screen.getByRole("combobox", { name: "Padding Vertical" }),
  ).toBeDefined();
});

test("選んでいるセグメントは padding と radius で別々に決まる", async () => {
  const user = renderBoxPanel({ ...UniformSides, ...UniformCorners });

  await user.click(segmentOf(PaddingRow, PerEdgeSegment));

  expect([pressedSegmentsOf(PaddingRow), pressedSegmentsOf(RadiusRow)]).toEqual(
    [[PerEdgeSegment], [ShorthandLabels.collapsed.radius]],
  );
});

test("辺の欄の読み上げ名は行の見出しと辺の綴りを繋いだものになる", async () => {
  const user = renderBoxPanel(UniformSides);

  await user.click(segmentOf(PaddingRow, PerEdgeSegment));

  expect(screen.getByRole("combobox", { name: "Padding Right" })).toBeDefined();
});

test("radius は隅ごとの行ではなく 1 つの行にまとまる", () => {
  renderBoxPanel(UniformCorners);

  /*
   * 畳んだ 1 欄が出て隅の欄が出ないことを 1 つの並びで見る。片方だけを見ると、
   * 束ねずに 4 行のまま出す実装でも「畳んだ欄が無い」側だけで通ってしまう。
   */
  expect(
    ["Radius", "Radius Top Left"].map(
      (name) => screen.queryAllByRole("combobox", { name }).length,
    ),
  ).toEqual([1, 0]);
});

test("radius の畳んだ欄には 4 隅に効いている値が出る", () => {
  /* padding は違う値（`sm`）で揃えておく。行を取り違えれば落ちる。 */
  renderBoxPanel({
    ...UniformSides,
    radiusTopLeft: "md",
    radiusTopRight: "md",
    radiusBottomRight: "md",
    radiusBottomLeft: "md",
  });

  expect(screen.getByRole("combobox", { name: "Radius" })).toHaveProperty(
    "value",
    "md",
  );
});

test("4 隅の値が違うと radius の畳んだ欄は不揃いと出る", () => {
  /* padding は揃えておく。揃っている側にも不揃いが出れば落ちる。 */
  renderBoxPanel({
    ...UniformSides,
    ...UniformCorners,
    radiusBottomLeft: "md",
  });

  expect(screen.getAllByRole("option", { name: "不揃い" })).toHaveLength(1);
});

test("隅ごとのセグメントを選ぶと 4 隅の欄が出る", async () => {
  const user = renderBoxPanel(UniformCorners);

  await user.click(segmentOf(RadiusRow, PerCornerSegment));

  const corners = [
    "Radius Top Left",
    "Radius Top Right",
    "Radius Bottom Right",
    "Radius Bottom Left",
  ];
  expect(
    corners.filter((name) => screen.queryByRole("combobox", { name }) !== null),
  ).toEqual(corners);
});

test("4 隅の欄を出すと畳んだ欄は出なくなる", async () => {
  const user = renderBoxPanel(UniformCorners);

  await user.click(segmentOf(RadiusRow, PerCornerSegment));

  expect(screen.queryByRole("combobox", { name: "Radius" })).toBeNull();
});

test("隅の欄の読み上げ名は行の見出しと隅の綴りを繋いだものになる", async () => {
  const user = renderBoxPanel(UniformCorners);

  await user.click(segmentOf(RadiusRow, PerCornerSegment));

  expect(
    screen.getByRole("combobox", { name: "Radius Bottom Right" }),
  ).toBeDefined();
});

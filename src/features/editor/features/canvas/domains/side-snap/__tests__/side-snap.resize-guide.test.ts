import { expect, test } from "vitest";
import { Offset } from "@/domains/unit/offset";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { Option } from "@/utils/Option";
import { type GrabbedEnds, SideSnap, type SideSnapped } from "../index";
import { GrabbedRight, Moving, RightAt144 } from "./moving-bounds";

/*
 * リサイズで掴んだ辺が揃ったときのガイド線（docs/06-ui.md「リサイズハンドル」の辺のスナップ）。
 * 掴んだ時点の矩形は `Moving`（左 100・右 140・上 100・下 120）で、ポインタは動かしていない
 * （掴んだ辺の行き先はその場）。
 */

/** 右下の角を掴んでいる。 */
const GrabbedBottomRight: GrabbedEnds = {
  width: Option.some("end"),
  height: Option.some("end"),
};

/** 下辺だけを掴んでいる。 */
const GrabbedBottom: GrabbedEnds = {
  width: Option.none,
  height: Option.some("end"),
};

/** 下辺が 124 にある揃え先（左右の辺は 600 / 640 で `Moving` から遠い）。 */
const BottomAt124: CanvasBounds = {
  left: 600,
  top: 24,
  width: 40,
  height: 100,
};

/**
 * 横のガイド線（上下の辺が揃った側）が横にまたぐ範囲。
 *
 * @param snapped 辺のスナップの答え
 * @returns 線の左端と長さ。横の線が無ければ `none`
 */
function horizontalSpanOfHorizontalLine(snapped: SideSnapped) {
  return Option.map(snapped.guides.vertical, (guide) => ({
    left: guide.guideLine.left,
    width: guide.guideLine.width,
  }));
}

/**
 * 縦のガイド線（左右の辺が揃った側）が縦にまたぐ範囲。
 *
 * @param snapped 辺のスナップの答え
 * @returns 線の上端と長さ。縦の線が無ければ `none`
 */
function verticalSpanOfVerticalLine(snapped: SideSnapped) {
  return Option.map(snapped.guides.horizontal, (guide) => ({
    top: guide.guideLine.top,
    height: guide.guideLine.height,
  }));
}

test("掴んだ右辺が揃え先の右辺に揃うと、揃え先の右辺に縦のガイド線が出る", () => {
  const snapped = SideSnap.toEdgeSnapped(
    SideSnap.create(Moving, [RightAt144]),
    GrabbedRight,
    Offset.Origin,
  );

  expect(
    Option.map(snapped.guides.horizontal, (guide) => ({
      left: guide.guideLine.left,
      width: guide.guideLine.width,
    })),
  ).toEqual(Option.some({ left: 143, width: 2 }));
});

test("掴んでいない上下の辺が揃え先の上辺の近くにあっても、横のガイド線は出ない", () => {
  // 上辺は 103 で Moving の上辺 100 から 3。右辺 144 には揃うので縦の線は出る
  const topAt103: CanvasBounds = { left: 44, top: 103, width: 100, height: 20 };

  const snapped = SideSnap.toEdgeSnapped(
    SideSnap.create(Moving, [topAt103]),
    GrabbedRight,
    Offset.Origin,
  );

  expect(snapped.guides.vertical).toEqual(Option.none);
});

test("ガイド線は伸ばしたあとのものと揃え先の両方をまたぐ長さで出る", () => {
  const snapped = SideSnap.toEdgeSnapped(
    SideSnap.create(Moving, [RightAt144]),
    GrabbedRight,
    Offset.Origin,
  );

  // 伸ばしたものの上辺 100 から、揃え先の下辺 320 まで
  expect(verticalSpanOfVerticalLine(snapped)).toEqual(
    Option.some({ top: 100, height: 220 }),
  );
});

test("掴んだ辺が既に揃え先の辺に重なっていて寄せ量が 0 でも、ガイド線は出る", () => {
  const rightAt140: CanvasBounds = {
    left: 40,
    top: 300,
    width: 100,
    height: 20,
  };

  const snapped = SideSnap.toEdgeSnapped(
    SideSnap.create(Moving, [rightAt140]),
    GrabbedRight,
    Offset.Origin,
  );

  expect(Option.isSome(snapped.guides.horizontal)).toBe(true);
});

test("掴んだ辺が揃うとみなす距離より離れていれば、ガイド線は出ない", () => {
  const rightAt147: CanvasBounds = {
    left: 47,
    top: 300,
    width: 100,
    height: 20,
  };

  const snapped = SideSnap.toEdgeSnapped(
    SideSnap.create(Moving, [rightAt147]),
    GrabbedRight,
    Offset.Origin,
  );

  expect(snapped.guides.horizontal).toEqual(Option.none);
});

test("掴んでいない左辺が揃え先の辺の近くにあっても、ガイド線は出ない", () => {
  // 左辺どうしは 3 離れているだけ。右辺は 303 で遠い
  const leftAt103: CanvasBounds = {
    left: 103,
    top: 300,
    width: 200,
    height: 20,
  };

  const snapped = SideSnap.toEdgeSnapped(
    SideSnap.create(Moving, [leftAt103]),
    GrabbedRight,
    Offset.Origin,
  );

  expect(snapped.guides.horizontal).toEqual(Option.none);
});

test("掴んだ辺が揃え先の中心線の近くにあっても、ガイド線は出ない", () => {
  // 左右の中心線は 138 で右辺 140 から 2 だけ。辺は 123 / 153 でどちらも届かない
  const midlineAt138: CanvasBounds = {
    left: 123,
    top: 300,
    width: 30,
    height: 20,
  };

  const snapped = SideSnap.toEdgeSnapped(
    SideSnap.create(Moving, [midlineAt138]),
    GrabbedRight,
    Offset.Origin,
  );

  expect(snapped.guides.horizontal).toEqual(Option.none);
});

test("右下の角で幅と高さの両方が揃うと、縦のガイド線は高さを寄せたあとの下辺までまたぐ", () => {
  // 右辺 144 の揃え先は上 0・下 20 にあり、下辺 124 の揃え先は左右 600 / 640 で遠い
  const rightAt144Above: CanvasBounds = {
    left: 44,
    top: 0,
    width: 100,
    height: 20,
  };
  const bottomAt124: CanvasBounds = {
    left: 600,
    top: 24,
    width: 40,
    height: 100,
  };

  const snapped = SideSnap.toEdgeSnapped(
    SideSnap.create(Moving, [rightAt144Above, bottomAt124]),
    GrabbedBottomRight,
    Offset.Origin,
  );

  // 揃え先の上辺 0 から、寄せたあとの下辺 124 まで（寄せる前の下辺なら 120）
  expect(verticalSpanOfVerticalLine(snapped)).toEqual(
    Option.some({ top: 0, height: 124 }),
  );
});

test("掴んだ下辺が揃え先の下辺に揃うと、揃え先の下辺に横のガイド線が出る", () => {
  const snapped = SideSnap.toEdgeSnapped(
    SideSnap.create(Moving, [BottomAt124]),
    GrabbedBottom,
    Offset.Origin,
  );

  expect(
    Option.map(snapped.guides.vertical, (guide) => ({
      top: guide.guideLine.top,
      height: guide.guideLine.height,
    })),
  ).toEqual(Option.some({ top: 123, height: 2 }));
});

test("右下の角で幅と高さの両方が揃うと、横のガイド線は幅を寄せたあとの右辺までまたぐ", () => {
  // 下辺 124 の揃え先は左 0・右 20 にあり、右辺 144 の揃え先は上下 300 / 320 で遠い
  const bottomAt124Left: CanvasBounds = {
    left: 0,
    top: 24,
    width: 20,
    height: 100,
  };

  const snapped = SideSnap.toEdgeSnapped(
    SideSnap.create(Moving, [RightAt144, bottomAt124Left]),
    GrabbedBottomRight,
    Offset.Origin,
  );

  // 揃え先の左辺 0 から、寄せたあとの右辺 144 まで（寄せる前の右辺なら 140）
  expect(horizontalSpanOfHorizontalLine(snapped)).toEqual(
    Option.some({ left: 0, width: 144 }),
  );
});

test("右下の角を反対の辺を越えた先まで運んで幅と高さの両方が揃うと、どちらのガイド線も越えた先の辺までまたぐ", () => {
  // 右辺 140 → 80・下辺 120 → 90 まで運び、左辺 100・上辺 100 を越える
  const rightAt78: CanvasBounds = { left: 38, top: 200, width: 40, height: 20 };
  const bottomAt88: CanvasBounds = {
    left: 200,
    top: 48,
    width: 20,
    height: 40,
  };

  const snapped = SideSnap.toEdgeSnapped(
    SideSnap.create(Moving, [rightAt78, bottomAt88]),
    GrabbedBottomRight,
    { x: -60, y: -30 },
  );

  // 縦の線は越えた先の下辺 88 から、横の線は越えた先の右辺 78 から（0 で止めた矩形なら 100 から）
  expect({
    verticalLineTop: Option.map(
      verticalSpanOfVerticalLine(snapped),
      (span) => span.top,
    ),
    horizontalLineLeft: Option.map(
      horizontalSpanOfHorizontalLine(snapped),
      (span) => span.left,
    ),
  }).toEqual({
    verticalLineTop: Option.some(88),
    horizontalLineLeft: Option.some(78),
  });
});

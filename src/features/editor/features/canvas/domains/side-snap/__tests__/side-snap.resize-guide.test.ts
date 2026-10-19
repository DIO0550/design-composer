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

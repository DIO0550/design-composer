import { expect, test } from "vitest";
import { SidePairs } from "@/domains/unit/side";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { FacingDistances } from "@/features/editor/features/canvas/domains/facing-distances";
import { SideSnap } from "@/features/editor/features/canvas/domains/side-snap";
import { Option } from "@/utils/Option";
import { RepositionGuides } from "../index";

/**
 * 運んでいる間と同じ手順で、吸い付きと Alt / Option の距離を 1 回の判定から作る。
 *
 * @param placement 寄せる前の運んでいるもの・落とし先の親・その親の直下の兄弟
 * @returns 吸い付いた線と、寄せたあとの位置から測った距離（除く前）
 */
function guidesAt({
  moving,
  parentBounds,
  siblings,
}: Readonly<{
  moving: CanvasBounds;
  parentBounds: CanvasBounds;
  siblings: readonly CanvasBounds[];
}>): RepositionGuides {
  const snapped = SideSnap.toSnapped(
    SideSnap.withSiblings(SideSnap.create(moving, [parentBounds]), siblings),
  );
  return {
    snap: snapped.guides,
    distances: FacingDistances.create({
      moved: CanvasBounds.movedBy(moving, snapped.offset),
      parentBounds,
      siblings,
    }),
  };
}

/** 落とし先の親（左右 0〜200・上下 0〜100）。 */
const Parent: CanvasBounds = { left: 0, top: 0, width: 200, height: 100 };

/** 下にいる兄弟（左右 50〜80・上下 60〜80）。運んでいるものの左辺がこの左辺へ寄る。 */
const Below: CanvasBounds = { left: 50, top: 60, width: 30, height: 20 };

/** 寄せる前の運んでいるもの（左右 52〜72・上下 10〜20）。 */
const Moving: CanvasBounds = { left: 52, top: 10, width: 20, height: 10 };

test("揃え先との隙間が同じ線を出している向きには、距離を出さない", () => {
  // 左辺が Below へ寄り（-2）、Below との隙間（上下 20〜60）を #453 が出す
  expect(
    RepositionGuides.distancesExceptGaps(
      guidesAt({ moving: Moving, parentBounds: Parent, siblings: [Below] }),
    ),
  ).toEqual({
    horizontal: {
      start: Option.some({
        along: SidePairs.Horizontal,
        at: 15,
        span: { min: 0, max: 50 },
      }),
      end: Option.some({
        along: SidePairs.Horizontal,
        at: 15,
        span: { min: 70, max: 200 },
      }),
    },
    vertical: {
      start: Option.some({
        along: SidePairs.Vertical,
        at: 60,
        span: { min: 0, max: 10 },
      }),
      end: Option.none,
    },
  });
});

test("揃え先より近い兄弟がいる向きには、距離を出す", () => {
  // Below との隙間は出たまま、下へ進むと先に手前の兄弟（上下 30〜40）に当たる
  const nearer = { left: 60, top: 30, width: 30, height: 10 };

  expect(
    RepositionGuides.distancesExceptGaps(
      guidesAt({
        moving: Moving,
        parentBounds: Parent,
        siblings: [Below, nearer],
      }),
    ).vertical.end,
  ).toEqual(
    Option.some({
      along: SidePairs.Vertical,
      at: 65,
      span: { min: 20, max: 30 },
    }),
  );
});

test("親の縁との隙間が同じ線を出している向きにも、距離を出さない", () => {
  /*
   * 親の下（外）にいて、左辺が親の左辺へ寄る（-0.9）。#453 は親の下辺との隙間（上下
   * 100.8〜110）を出し、上へ進んだ距離も親の下辺に当たって同じ線になる。親の座標に端数を
   * 持たせ、縁の矩形を別の式で作ると線がずれることを見る。
   */
  const parentBounds = { left: 0.1, top: 0.1, width: 200.3, height: 100.7 };
  // 右へ進むと当たる兄弟（上下 80〜130）。辺も中心線も運んでいるものから 6 より離す
  const right = { left: 40, top: 80, width: 20, height: 50 };

  const distances = RepositionGuides.distancesExceptGaps(
    guidesAt({
      moving: { left: 1, top: 110, width: 20, height: 10 },
      parentBounds,
      siblings: [right],
    }),
  );

  expect(distances.vertical.start).toEqual(Option.none);
  expect(Option.isSome(distances.horizontal.end)).toBe(true);
});

test("横に測った隙間が同じ線を出している向きにも、距離を出さない", () => {
  // 上辺が右の兄弟（上下 32〜52）へ寄り（+2）、その兄弟との隙間（左右 70〜120）を #453 が出す
  const right = { left: 120, top: 32, width: 30, height: 20 };

  const distances = RepositionGuides.distancesExceptGaps(
    guidesAt({
      moving: { left: 50, top: 30, width: 20, height: 10 },
      parentBounds: Parent,
      siblings: [right],
    }),
  );

  expect(distances.horizontal.end).toEqual(Option.none);
  expect(distances.horizontal.start).toEqual(
    Option.some({
      along: SidePairs.Horizontal,
      at: 37,
      span: { min: 0, max: 50 },
    }),
  );
});

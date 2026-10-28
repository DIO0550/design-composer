import { expect, test } from "vitest";
import { SidePairs } from "@/domains/unit/side";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { SideSnap } from "@/features/editor/features/canvas/domains/side-snap";
import { Option } from "@/utils/Option";
import { RepositionLines } from "../index";

/**
 * 親とその直下の兄弟へ吸い付かせ、Alt / Option の距離も測ったときに出す距離。
 *
 * @param placement 寄せる前の運んでいるもの・落とし先の親・その親の直下の兄弟
 * @returns 揃え先との隙間と同じ線を除いた距離
 */
function distanceLinesAt({
  moving,
  parentBounds,
  siblings,
}: Readonly<{
  moving: CanvasBounds;
  parentBounds: CanvasBounds;
  siblings: readonly CanvasBounds[];
}>) {
  const snapped = RepositionLines.toSnapped(
    SideSnap.withSiblings(SideSnap.create(moving, [parentBounds]), siblings),
    Option.some({ parentBounds, siblings }),
  );
  return RepositionLines.distanceLinesExceptGaps(snapped.lines);
}

/** 落とし先の親（左右 0〜200・上下 0〜100）。 */
const Parent: CanvasBounds = { left: 0, top: 0, width: 200, height: 100 };

/** 下にいる兄弟（左右 50〜80・上下 60〜80）。運んでいるものの左辺がこの左辺へ寄る。 */
const Below: CanvasBounds = { left: 50, top: 60, width: 30, height: 20 };

/** 寄せる前の運んでいるもの（左右 52〜72・上下 10〜20）。 */
const Moving: CanvasBounds = { left: 52, top: 10, width: 20, height: 10 };

test("揃え先との隙間が同じ線を出している向きには、距離を出さない", () => {
  // 左辺が Below へ寄り（-2）、揃え先 Below との隙間（上下 20〜60）が出る
  expect(
    distanceLinesAt({
      moving: Moving,
      parentBounds: Parent,
      siblings: [Below],
    }),
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
    distanceLinesAt({
      moving: Moving,
      parentBounds: Parent,
      siblings: [Below, nearer],
    }).vertical.end,
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
   * 親の下（外）にいて、左辺が親の左辺へ寄る（-0.9）。揃え先との隙間は親の下辺との間（上下
   * 100.8〜110）に出て、上へ進んだ距離も親の下辺に当たって同じ線になる。親の座標に端数を
   * 持たせ、縁の矩形を別の式で作ると線がずれることを見る。
   */
  const parentBounds = { left: 0.1, top: 0.1, width: 200.3, height: 100.7 };
  // 右へ進むと当たる兄弟（上下 80〜130）。辺も中心線も運んでいるものから 6 より離す
  const right = { left: 40, top: 80, width: 20, height: 50 };

  const distances = distanceLinesAt({
    moving: { left: 1, top: 110, width: 20, height: 10 },
    parentBounds,
    siblings: [right],
  });

  expect(distances.vertical.start).toEqual(Option.none);
  expect(Option.isSome(distances.horizontal.end)).toBe(true);
});

test("横に測った隙間が同じ線を出している向きにも、距離を出さない", () => {
  // 上辺が右の兄弟（上下 32〜52）へ寄り（+2）、揃え先のその兄弟との隙間（左右 70〜120）が出る
  const right = { left: 120, top: 32, width: 30, height: 20 };

  const distances = distanceLinesAt({
    moving: { left: 50, top: 30, width: 20, height: 10 },
    parentBounds: Parent,
    siblings: [right],
  });

  expect(distances.horizontal.end).toEqual(Option.none);
  expect(distances.horizontal.start).toEqual(
    Option.some({
      along: SidePairs.Horizontal,
      at: 37,
      span: { min: 0, max: 50 },
    }),
  );
});

test("寄せ量に端数があっても、揃え先との隙間と同じ線の向きには距離を出さない", () => {
  /*
   * 左辺が Below の左辺へ寄る量は -0.10000000000000142。寄せたあとの矩形を隙間と別の式で
   * 作ると線の位置が数 ULP ずれ、下の距離が隙間と別の線として残る。
   */
  const distances = distanceLinesAt({
    moving: { left: 50.1, top: 10.1, width: 19.7, height: 10 },
    parentBounds: Parent,
    siblings: [Below],
  });

  expect(distances.vertical.end).toEqual(Option.none);
  expect(Option.isSome(distances.vertical.start)).toBe(true);
});

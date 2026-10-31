import { expect, test } from "vitest";
import { SidePairs } from "@/domains/unit/side";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { FacingDistances } from "@/features/editor/features/canvas/domains/facing-distances";
import {
  SideSnap,
  type SnapGuide,
} from "@/features/editor/features/canvas/domains/side-snap";
import type { ThinLine } from "@/features/editor/features/canvas/domains/thin-line";
import { Option } from "@/utils/Option";
import { RepositionLines } from "../index";

/**
 * 親とその直下の兄弟へ吸い付かせたときに出すガイド。
 *
 * @param placement 寄せる前の運んでいるもの・落とし先の親・その親の直下の兄弟と、
 *   Alt / Option の距離を測るか
 * @returns Alt / Option の距離と同じ線上に重なる隙間を除いたガイド
 */
function snapGuidesAt({
  moving,
  parentBounds,
  siblings,
  measuresDistances,
}: Readonly<{
  moving: CanvasBounds;
  parentBounds: CanvasBounds;
  siblings: readonly CanvasBounds[];
  measuresDistances: boolean;
}>) {
  const distanceTargets = measuresDistances
    ? Option.some({ kind: "within-parent" as const, parentBounds, siblings })
    : Option.none;
  const snapped = RepositionLines.toSnapped(
    SideSnap.withSiblings(SideSnap.create(moving, [parentBounds]), siblings),
    distanceTargets,
  );
  return RepositionLines.snapGuidesExceptCoincidingGaps(snapped.lines);
}

/** 落とし先の親（左右 0〜200・上下 0〜100）。 */
const Parent: CanvasBounds = { left: 0, top: 0, width: 200, height: 100 };

/** 下にいる兄弟（左右 50〜80・上下 60〜80）。運んでいるものの左辺がこの左辺へ寄る。 */
const Below: CanvasBounds = { left: 50, top: 60, width: 30, height: 20 };

/** 寄せる前の運んでいるもの（左右 52〜72・上下 10〜20）。 */
const Moving: CanvasBounds = { left: 52, top: 10, width: 20, height: 10 };

/**
 * `Moving` の左辺が `Below` へ寄ったときの、揃え先 `Below` との隙間の線（縦に伸びる・左右 60・
 * 上下 20〜60）。手で組むガイドの隙間にも使う。
 */
const BelowGap: ThinLine = {
  along: SidePairs.Vertical,
  at: 60,
  span: { min: 20, max: 60 },
};

/** 手で組むガイド（左右 60 に縦のガイド線、`BelowGap` の隙間）。 */
const HandGuide: SnapGuide = {
  guideLine: { left: 59, top: 0, width: 2, height: 100 },
  gapLine: Option.some(BelowGap),
};

test("揃え先と同じ相手までの距離が出ている向きでは、隙間を出さずガイド線は残す", () => {
  // 左辺が Below へ寄り（-2）、揃え先 Below との隙間（上下 20〜60）と下へ進んだ距離が同じ線になる
  const guides = snapGuidesAt({
    moving: Moving,
    parentBounds: Parent,
    siblings: [Below],
    measuresDistances: true,
  });

  // ガイド線は Below の左辺（左右 50）に、運んでいるもの（上下 10〜20）から Below まで引く
  expect(Option.unwrap(guides.horizontal)).toEqual({
    guideLine: { left: 49, top: 10, width: 2, height: 70 },
    gapLine: Option.none,
  });
});

test("揃え先より近い兄弟までの距離が、直交方向 5px の差で同じ線上に重なると、隙間を出さない", () => {
  // 隙間は左右 60、下へ進むと先に手前の兄弟（上下 30〜40）に当たる距離は左右 65
  const nearer = { left: 60, top: 30, width: 30, height: 10 };

  const guides = snapGuidesAt({
    moving: Moving,
    parentBounds: Parent,
    siblings: [Below, nearer],
    measuresDistances: true,
  });

  expect(Option.unwrap(guides.horizontal).gapLine).toEqual(Option.none);
});

test("直交方向の差がちょうど 8px の兄弟までの距離なら、隙間を出さない", () => {
  // 隙間は左右 60、手前の兄弟（左右 66〜120）までの距離は左右 68
  const nearer = { left: 66, top: 30, width: 54, height: 10 };

  const guides = snapGuidesAt({
    moving: Moving,
    parentBounds: Parent,
    siblings: [Below, nearer],
    measuresDistances: true,
  });

  expect(Option.unwrap(guides.horizontal).gapLine).toEqual(Option.none);
});

test("直交方向の差が 8px を超える兄弟までの距離なら、隙間を出したまま", () => {
  // 隙間は左右 60、手前の兄弟（左右 67〜120）までの距離は左右 68.5
  const nearer = { left: 67, top: 30, width: 53, height: 10 };

  const guides = snapGuidesAt({
    moving: Moving,
    parentBounds: Parent,
    siblings: [Below, nearer],
    measuresDistances: true,
  });

  expect(Option.unwrap(guides.horizontal).gapLine).toEqual(
    Option.some(BelowGap),
  );
});

test("親の縁との隙間も、同じ線上に重なる距離が出ていれば出さない", () => {
  /*
   * 親の下（外）にいて、左辺が親の左辺へ寄る（-0.9）。揃え先との隙間は親の下辺との間（上下
   * 100.8〜110）に出て、上へ進んだ距離も親の下辺に当たって同じ線になる。
   */
  const parentBounds = { left: 0.1, top: 0.1, width: 200.3, height: 100.7 };
  // 右へ進むと当たる兄弟（上下 80〜130）。辺も中心線も運んでいるものから 6 より離す
  const right = { left: 40, top: 80, width: 20, height: 50 };

  const guides = snapGuidesAt({
    moving: { left: 1, top: 110, width: 20, height: 10 },
    parentBounds,
    siblings: [right],
    measuresDistances: true,
  });

  expect(Option.unwrap(guides.horizontal).gapLine).toEqual(Option.none);
});

test("横に測った隙間も、同じ線上に重なる距離が出ていれば出さない", () => {
  // 上辺が右の兄弟（上下 32〜52）へ寄り（+2）、揃え先のその兄弟との隙間（左右 70〜120）が出る
  const right = { left: 120, top: 32, width: 30, height: 20 };

  const guides = snapGuidesAt({
    moving: { left: 50, top: 30, width: 20, height: 10 },
    parentBounds: Parent,
    siblings: [right],
    measuresDistances: true,
  });

  expect(Option.unwrap(guides.vertical).gapLine).toEqual(Option.none);
});

test("Alt / Option で距離を測らない回は、隙間をそのまま出す", () => {
  const guides = snapGuidesAt({
    moving: Moving,
    parentBounds: Parent,
    siblings: [Below],
    measuresDistances: false,
  });

  expect(Option.unwrap(guides.horizontal).gapLine).toEqual(
    Option.some(BelowGap),
  );
});

test("隙間と同じ向きの距離が反対側にあり範囲が離れているなら、隙間は出たまま", () => {
  const guides = RepositionLines.snapGuidesExceptCoincidingGaps({
    snap: { horizontal: Option.some(HandGuide), vertical: Option.none },
    distanceLines: {
      ...FacingDistances.None,
      vertical: {
        start: Option.some({
          along: SidePairs.Vertical,
          at: 60,
          span: { min: 0, max: 10 },
        }),
        end: Option.none,
      },
    },
  });

  expect(Option.unwrap(guides.horizontal).gapLine).toEqual(
    Option.some(BelowGap),
  );
});

test("直交する向きの距離が近い位置にあっても、隙間は出たまま", () => {
  const guides = RepositionLines.snapGuidesExceptCoincidingGaps({
    snap: { horizontal: Option.some(HandGuide), vertical: Option.none },
    distanceLines: {
      ...FacingDistances.None,
      horizontal: {
        start: Option.none,
        end: Option.some({
          along: SidePairs.Horizontal,
          at: 60,
          span: { min: 20, max: 60 },
        }),
      },
    },
  });

  expect(Option.unwrap(guides.horizontal).gapLine).toEqual(
    Option.some(BelowGap),
  );
});

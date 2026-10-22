import { expect, test } from "vitest";
import { SideSnap } from "@/features/editor/features/canvas/domains/side-snap";
import { Option } from "@/utils/Option";
import { ArtboardDrag } from "../index";
import {
  HomeDrawn,
  heldDrag,
  moveSnapped,
  pointerBy,
  StationaryDrawn,
} from "./held-drag";

test("揃え先の左辺の近くまで運んでいる間は、その辺に線が出る", () => {
  /*
   * 右辺が 403 まで来て揃え先の左辺（400）へ 3px 寄る。線は揃え先の左辺に立ち、
   * 運んでいる artboard（上辺 40）から揃え先（下辺 380）までをまたぐ。
   */
  const dragging = moveSnapped(heldDrag(), pointerBy({ x: 103, y: 0 }), {
    carried: HomeDrawn,
    stationary: [StationaryDrawn],
  });

  const guideLine = Option.map(
    ArtboardDrag.snapGuides(dragging).horizontal,
    (guide) => guide.guideLine,
  );

  expect(guideLine).toEqual(
    Option.some({ left: 399, top: 40, width: 2, height: 340 }),
  );
});

test("揃う位置まで運んだあと、どこにも届かない位置まで動かし直すと、線が無くなる", () => {
  /*
   * 1 回目で 103 運んで 3px 寄せたので、`home` は 100 ずれた 200 に描かれている。
   * 2 回目は掴んでから 150 の位置で、行き先の右辺は 450 → どの線からも閾値の外。
   */
  const stationary = [StationaryDrawn];
  const dragging = moveSnapped(heldDrag(), pointerBy({ x: 103, y: 0 }), {
    carried: HomeDrawn,
    stationary,
  });

  const away = moveSnapped(dragging, pointerBy({ x: 150, y: 0 }), {
    carried: { ...HomeDrawn, left: 200 },
    stationary,
  });

  expect(ArtboardDrag.snapGuides(away)).toEqual(SideSnap.NoGuides);
});

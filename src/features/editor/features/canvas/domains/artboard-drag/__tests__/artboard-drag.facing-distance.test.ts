import { expect, test } from "vitest";
import { SidePairs } from "@/domains/unit/side";
import { FacingDistances } from "@/features/editor/features/canvas/domains/facing-distances";
import { Option } from "@/utils/Option";
import { ArtboardDrag } from "../index";
import {
  HomeDrawn,
  heldDrag,
  moveSnapped,
  pointerInputBy,
  StationaryDrawn,
} from "./held-drag";

/*
 * Alt / Option を押しながら artboard を運んでいる間の、他の artboard までの距離
 * （docs/06-ui.md「キャンバス直接操作」の artboard の移動）。
 *
 * `home`（左右 100〜300・上下 40〜140）を (103, 0) 運ぶと、右辺が 403 まで来て揃え先の左辺
 * （400）へ 3px 寄る。右の相手は上下 100〜200 で `home` と 100〜140 が重なる。
 */

/** `home` の右に置いた、`home` と上下で重なる artboard の矩形（画面上の px）。 */
const RightDrawn = { left: 450, top: 100, width: 50, height: 100 };

test("測る回は、相手のいる向きに最初に当たる相手までの線が出る", () => {
  // 吸い付いたあとの右辺（400）から測る。吸い付く前（403）から測ると 403〜450 になる
  const dragging = moveSnapped(
    heldDrag(),
    pointerInputBy({ x: 103, y: 0 }, { measuresDistances: true }),
    { carried: HomeDrawn, others: [StationaryDrawn, RightDrawn] },
  );

  expect(ArtboardDrag.facingDistances(dragging).horizontal.end).toEqual(
    Option.some({
      along: SidePairs.Horizontal,
      at: 120,
      span: { min: 400, max: 450 },
    }),
  );
});

test("測らない回は、距離が出ない", () => {
  const dragging = moveSnapped(heldDrag(), pointerInputBy({ x: 103, y: 0 }), {
    carried: HomeDrawn,
    others: [StationaryDrawn, RightDrawn],
  });

  expect(ArtboardDrag.facingDistances(dragging)).toEqual(FacingDistances.None);
});

test("吸い付かない回は、吸い付かない位置から測る", () => {
  const dragging = moveSnapped(
    heldDrag(),
    pointerInputBy({ x: 103, y: 0 }, { snaps: false, measuresDistances: true }),
    { carried: HomeDrawn, others: [StationaryDrawn, RightDrawn] },
  );

  expect(ArtboardDrag.facingDistances(dragging).horizontal.end).toEqual(
    Option.some({
      along: SidePairs.Horizontal,
      at: 120,
      span: { min: 403, max: 450 },
    }),
  );
});

/**
 * 左辺が 203 まで来て上の相手の左辺（200）へ 3px 寄り、左右 200〜400 になる位置まで運んだ状態。
 * 上の相手との隙間（上下 -50〜40）と、上へ進んだ距離が同じ線になる。
 *
 * @returns Alt / Option を押して運んでいる状態
 */
function draggingAlignedWithAbove() {
  const above = { left: 200, top: -100, width: 100, height: 50 };
  return moveSnapped(
    heldDrag(),
    pointerInputBy({ x: 103, y: 0 }, { measuresDistances: true }),
    { carried: HomeDrawn, others: [above, RightDrawn] },
  );
}

test("揃え先との隙間と同じ線になる向きにも、距離を出す", () => {
  expect(ArtboardDrag.facingDistances(draggingAlignedWithAbove())).toEqual({
    horizontal: {
      start: Option.none,
      end: Option.some({
        along: SidePairs.Horizontal,
        at: 120,
        span: { min: 400, max: 450 },
      }),
    },
    vertical: {
      start: Option.some({
        along: SidePairs.Vertical,
        at: 250,
        span: { min: -50, max: 40 },
      }),
      end: Option.none,
    },
  });
});

test("同じ線の距離が出ているとき、ガイドはガイド線を残して隙間を出さない", () => {
  const guides = ArtboardDrag.snapGuides(draggingAlignedWithAbove());

  expect(Option.unwrap(guides.horizontal).gapLine).toEqual(Option.none);
});

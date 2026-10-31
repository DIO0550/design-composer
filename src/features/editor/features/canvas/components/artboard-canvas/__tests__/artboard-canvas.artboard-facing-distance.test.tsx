import { expect, test, vi } from "vitest";
import {
  artboardHandle,
  canvasSurface,
} from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  movePointer,
  wheel,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import {
  distanceLabels,
  drawnAt,
  renderCanvas,
  sortedFacingDistanceLabels,
} from "./setup";
import {
  carrySecond,
  dragSecond,
  drawnFollowingFrame,
  drawnFollowingFrames,
  setupSelection,
} from "./snap-artboards";

/*
 * Alt / Option を押しながら artboard を運んでいる間の、上下左右それぞれ最初に当たる他の
 * artboard までの距離（docs/06-ui.md「キャンバス直接操作」の artboard の移動）。運んでいる最中
 * にしか出ないので、離す前の状態（`carrySecond`）で見る。
 *
 * 既定の並び（`drawnFollowingFrames`）は 200 × 140 の 3 枚を x = 0 / 232 / 464、y = 0 に置く。
 */

/**
 * `first` を左上（0, 0）に、`third` を `second` の下（左右 250〜450・上下 400〜540）に描き、
 * `second` は枠に追従させる。`second` を (0, 100) 運ぶと左右 232〜432・上下 100〜240 で、
 * どの辺からも吸い付く距離の外にあり、左に `first`、下に `third` が当たる。
 */
function drawnWithThirdBelow(): void {
  drawnAt("first", { left: 0, top: 0, width: 200, height: 140 });
  drawnFollowingFrame("second");
  drawnAt("third", { left: 250, top: 400, width: 200, height: 140 });
}

test("Alt を押しながら運んでいる間、向きごとに最初に当たる他の artboard までの距離が出る", () => {
  renderCanvas({ selection: setupSelection() });
  drawnWithThirdBelow();

  // 左は `first` の右辺まで 32、下は `third` の上辺まで 160
  carrySecond({ x: 0, y: 100 }, "alt");

  expect(sortedFacingDistanceLabels()).toEqual(["160", "32"]);
});

test("倍率を上げて運んでいる間も、距離はドキュメント上の px で出る", () => {
  renderCanvas({ selection: setupSelection() });
  wheel(canvasSurface(), { x: 0, y: -100 }, "ctrl");

  /*
   * 1.2 倍で見ているときの描かれた矩形（`drawnWithThirdBelow` と同じ並びを 1.2 倍したもの）。
   * 動かすのは 1 回だけで、その間は描き直す前の実測が読まれるので固定の矩形でよい。
   */
  drawnAt("first", { left: 0, top: 0, width: 240, height: 168 });
  drawnAt("second", { left: 278.4, top: 0, width: 240, height: 168 });
  drawnAt("third", { left: 300, top: 480, width: 240, height: 168 });

  /*
   * 画面上で (0, 120) 運ぶと、左の `first` まで画面上で 38.4・ドキュメント上で 32、下の
   * `third` まで画面上で 192・ドキュメント上で 160。倍率を表示へ渡し忘れると画面上の値が出る。
   */
  carrySecond({ x: 0, y: 120 }, "alt");

  expect(sortedFacingDistanceLabels()).toEqual(["160", "32"]);
});

test("Alt を押さずに運んでいる間は、距離が出ない", () => {
  renderCanvas({ selection: setupSelection() });
  drawnWithThirdBelow();

  carrySecond({ x: 0, y: 100 });

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

test("Alt を押したままでも吸い付き、離すと吸い付いた位置の座標が書かれる", () => {
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });
  drawnFollowingFrames();

  // 左辺が `first` の右辺 200 を 3px 越えた位置（artboard-canvas.artboard-snap.test.tsx の 1 件目）
  dragSecond({ x: -29, y: 30 }, "alt");

  expect(onRepositionArtboard).toHaveBeenCalledWith("second", {
    x: 200,
    y: 30,
  });
});

test("Alt を押していても、距離と同じ線上に重ならない揃え先との隙間は出したまま", () => {
  renderCanvas({ selection: setupSelection() });
  drawnFollowingFrames();

  // 左辺が `first` の右辺 200 へ寄り、上下 200〜340。`first` の下辺 140 との隙間 60
  carrySecond({ x: -29, y: 200 }, "alt");

  expect(distanceLabels("snap-gap")).toEqual(["60"]);
  expect(sortedFacingDistanceLabels()).toEqual([]);
});

test("揃え先との隙間と同じ線になる向きは、距離だけを出す", () => {
  renderCanvas({ selection: setupSelection() });
  drawnAt("first", { left: 0, top: 0, width: 200, height: 140 });
  drawnFollowingFrame("second");
  drawnAt("third", { left: 464, top: 230, width: 200, height: 140 });

  /*
   * 左辺が `first` の左辺 0 へ寄り、左右 0〜200・上下 200〜340。上は `first` との隙間 60 と
   * 同じ線になるので隙間を出さず、上の距離 60 と右の `third` の左辺までの 264 を出す。
   */
  carrySecond({ x: -229, y: 200 }, "alt");

  expect(distanceLabels("snap-gap")).toEqual([]);
  expect(sortedFacingDistanceLabels()).toEqual(["264", "60"]);
});

test("⌘ と Alt を一緒に押していると、吸い付かない位置から距離を測り、隙間は出ない", () => {
  renderCanvas({ selection: setupSelection() });
  drawnFollowingFrames();

  // 対照。Alt だけなら左辺が 200 へ寄って `first` に接し、右の `third` までの 64 だけが出る
  carrySecond({ x: -29, y: 30 }, "alt");
  expect(sortedFacingDistanceLabels()).toEqual(["64"]);

  // 同じ位置で ⌘ も押すと吸い付かず、左右 203〜403。左の `first` まで 3、右の `third` まで 61
  movePointer(artboardHandle("second"), { x: -29, y: 30 }, "meta+alt");

  expect(sortedFacingDistanceLabels()).toEqual(["3", "61"]);
  expect(distanceLabels("snap-gap")).toEqual([]);
});

test("まだ描かれていない（大きさの無い）artboard までは測らない", () => {
  renderCanvas({ selection: setupSelection() });
  drawnAt("first", { left: 0, top: 0, width: 200, height: 140 });
  drawnFollowingFrame("second");
  // 高さだけが 0。大きさで外さなければ、下の `third` まで 160 が出る
  drawnAt("third", { left: 250, top: 400, width: 200, height: 0 });

  carrySecond({ x: 0, y: 100 }, "alt");

  expect(sortedFacingDistanceLabels()).toEqual(["32"]);
});

test("Alt を離して動かし直すと、距離は消える", () => {
  renderCanvas({ selection: setupSelection() });
  drawnWithThirdBelow();

  carrySecond({ x: 0, y: 100 }, "alt");
  movePointer(artboardHandle("second"), { x: 0, y: 110 }, "none");

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

test("離すと距離は消える", () => {
  renderCanvas({ selection: setupSelection() });
  drawnWithThirdBelow();

  dragSecond({ x: 0, y: 100 }, "alt");

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

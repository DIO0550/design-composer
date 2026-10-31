import { expect, test, vi } from "vitest";
import { RepositionEdit } from "@/domains/dcmp/reposition-edit";
import { canvasSurface } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  movePointer,
  wheel,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import {
  carryNode,
  distanceLabels,
  dragNode,
  drawn,
  renderCanvas,
  snapGuides,
  sortedFacingDistanceLabels,
} from "./setup";
import { drawnApart, setupSiblings } from "./snap-siblings";

/*
 * Alt / Option を押しながら運んでいる間の、上下左右の相手までの距離（docs/06-ui.md「キャンバス
 * 直接操作」）。運んでいる最中にしか出ないので、離す前の状態（`carryNode`）で見る。
 *
 * `badge` を (113, -12) 運ぶと、左辺が `marker` の左辺（250）へ寄り、上 72・下 84・左 250・
 * 右 270 になる（artboard-canvas.snap-gap.test.tsx の 1 件目）。`home` は左右 100〜460・
 * 上下 60〜300、`card` は左右 200〜320・上下 150〜210。
 */

test("Alt を押しながら運んでいる間、上下左右それぞれ最初に当たる相手までの距離が出る", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();

  // 上は `home` の上辺まで 12、左は左辺まで 150、右は右辺まで 190、下は `card` の上辺まで 66
  carryNode("badge", { x: 113, y: -12 }, "alt");

  expect(sortedFacingDistanceLabels()).toEqual(["12", "150", "190", "66"]);
});

test("Alt を押さずに運んでいる間は、距離が出ない", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();

  carryNode("badge", { x: 113, y: -12 });

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

test("Alt を押したままでも吸い付き、離すと吸い付いた位置の座標が書かれる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSiblings(), onRepositionNode });
  drawnApart();

  dragNode("badge", { x: 113, y: -12 }, "alt");

  expect(onRepositionNode).toHaveBeenCalledWith(
    "badge",
    RepositionEdit.create({
      parentName: "home",
      placement: { mode: "absolute", x: 150, y: 12 },
    }),
  );
});

test("Alt を押して運んでいる間、距離と同じ線上に重なる揃え先との隙間は出さず、ガイド線は出したまま", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();

  // `marker` との隙間 116 は、下の `card` までの距離 66 と同じ線上に重なる
  carryNode("badge", { x: 113, y: -12 }, "alt");

  expect(distanceLabels("snap-gap")).toEqual([]);
  expect(sortedFacingDistanceLabels()).toEqual(["12", "150", "190", "66"]);
  expect(snapGuides()).toHaveLength(1);
});

test("揃え先との隙間と同じ線になる向きは、距離だけを出す", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();

  /*
   * 左辺が `card` の左辺（200）へ寄り、左右 200〜220・上下 72〜84 になる。下は揃え先 `card`
   * との隙間と同じ線になるので、隙間を出さず距離 66 を出す。
   */
  carryNode("badge", { x: 60, y: -12 }, "alt");

  expect(distanceLabels("snap-gap")).toEqual([]);
  expect(sortedFacingDistanceLabels()).toEqual(["100", "12", "240", "66"]);
});

test("⌘ と Alt を一緒に押していると、吸い付かない位置から距離を測る", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();

  // 吸い付かないので左右 253〜273。左は 153、右は 187 になる
  carryNode("badge", { x: 113, y: -12 }, "meta+alt");

  expect(sortedFacingDistanceLabels()).toEqual(["12", "153", "187", "66"]);
  expect(distanceLabels("snap-gap")).toEqual([]);
});

test("Alt を離して動かし直すと、距離は消える", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();

  carryNode("badge", { x: 113, y: -12 }, "alt");
  movePointer(drawn("badge"), { x: 213, y: 88 }, "none");

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

test("離すと距離は消える", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();

  dragNode("badge", { x: 113, y: -12 }, "alt");

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

test("倍率に端数があっても、親の縁に外側から吸い付いた向きには距離を出さない", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();
  wheel(canvasSurface(), { x: 0, y: -100 }, "ctrl");

  // 対照。1.2 倍で親の内側にいる間は 4 向きとも出る
  carryNode("badge", { x: 97.9, y: -20 }, "alt");
  expect(sortedFacingDistanceLabels()).toEqual(["125", "158", "58", "7"]);

  /*
   * 下辺が `home` の上辺（60）へ外側から吸い付く（上辺は 48.00000000000001 で、下辺は数 ULP
   * だけ `home` の内側に入る）。下へ進むと上辺に接し、左右は `home` と縦に幅を持って重ならない
   * ので、どの向きにも距離は出ない。丸めずに比べると接した上辺を外して奥の下辺まで測り、
   * 縁を 1 本だけ見ると下辺まで突き抜ける。隙間は `marker` の上辺まで出たまま。
   */
  movePointer(drawn("badge"), { x: 197.9, y: 63.4 }, "alt");

  expect(sortedFacingDistanceLabels()).toEqual([]);
  expect(distanceLabels("snap-gap")).toEqual(["117"]);
});

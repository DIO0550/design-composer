import { expect, test } from "vitest";
import { canvasSurface } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import { wheel } from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { carryNode, dragNode, renderCanvas, snapGapLabels } from "./setup";
import { drawnApart, setupSiblings } from "./snap-siblings";

/*
 * 揃え先との隙間の数値（docs/06-ui.md「キャンバス直接操作」の辺のスナップ）。
 * 運んでいる最中にしか出ないので、離す前の状態（`carryNode`）で見る。
 */

test("兄弟の辺へ吸い付いている間、揃え先との隙間がドキュメント上の px で出る", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();

  /*
   * 左辺が `marker` の左辺（250）へ寄り、`badge` は上 72・下 84 になる（縦はどの辺も
   * 届かない）。`marker` の上辺 200 までの縦の隙間は 116。
   */
  carryNode("badge", { x: 113, y: -12 });

  expect(snapGapLabels()).toEqual(["116"]);
});

test("離すと隙間の数値は消える", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();

  // 上のテストと同じ量を運んで離す（運んでいる間だけの提示なので、離したあとは残らない）
  dragNode("badge", { x: 113, y: -12 });

  expect(snapGapLabels()).toHaveLength(0);
});

test("倍率を上げて運んでいる間も、隙間の数値はドキュメント上の px で出る", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();
  wheel(canvasSurface(), { x: 0, y: -100 }, "ctrl");

  /*
   * 1.2 倍で見ているとき、`badge` は画面上の上 88.8 から始まり、縦に −12 運ぶと下辺が
   * 88.8 になる。`marker` の上辺（200）まで画面上で 111.2、ドキュメント上で 92.67 → 93。
   * 倍率を表示へ渡し忘れると、画面上の値（111）が出る。
   */
  carryNode("badge", { x: 105, y: -12 });

  expect(snapGapLabels()).toEqual(["93"]);
});

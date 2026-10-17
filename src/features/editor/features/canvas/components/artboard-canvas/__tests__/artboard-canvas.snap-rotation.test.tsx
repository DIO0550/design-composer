import { expect, test, vi } from "vitest";
import { carryNode, dragNode, renderCanvas, snapGapLabels } from "./setup";
import { drawnApart, drawnTurnedBadge, setupSiblings } from "./snap-siblings";

/*
 * 回って描かれているノードの辺のスナップ（docs/06-ui.md「キャンバス直接操作」の辺のスナップ）。
 * `badge` は回る前が 20x12 で、90 度回って 12x20 の外接矩形に描かれている。運んだ先では
 * 回る前の矩形の左上から 4 右・4 上が外接矩形の左上になる。
 */

test("90 度回ったノードを運び、外接矩形の左辺が兄弟の左辺に近づいたら、外接矩形の左辺が揃う座標が書かれる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSiblings(90), onRepositionNode });
  drawnApart();
  drawnTurnedBadge();

  /*
   * 回る前の左上は (243, 72) へ来て、外接矩形の左辺は 247。`marker` の左辺（250）へ寄ると
   * 回る前の左上は 246 で、ドキュメント上の x は 146。今の実測（外接矩形）を回る前の矩形と
   * して置くと 138、回る前の矩形のまま当てると 143 になる。
   */
  dragNode("badge", { x: 103, y: -12 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 146, y: 12 },
  });
});

test("90 度回ったノードを運んで兄弟の左辺へ吸い付いている間、隙間の数値は外接矩形の下辺から測られる", () => {
  renderCanvas({ selection: setupSiblings(90) });
  drawnApart();
  drawnTurnedBadge();

  /*
   * 上のテストと同じ量を運ぶ。外接矩形は上 68・下 88 で、`marker` の上辺 200 までは 112。
   * 今の実測（外接矩形）を回る前の矩形として置くと 108、回る前の矩形のまま当てると吸い付か
   * ず数値は出ない。
   */
  carryNode("badge", { x: 103, y: -12 });

  expect(snapGapLabels()).toEqual(["112"]);
});

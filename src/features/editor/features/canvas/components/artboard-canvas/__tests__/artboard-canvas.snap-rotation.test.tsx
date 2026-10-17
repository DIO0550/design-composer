import { expect, test, vi } from "vitest";
import { carryNode, dragNode, renderCanvas, snapGapLabels } from "./setup";
import { drawnApart, drawnTurnedBadge, setupSiblings } from "./snap-siblings";

/*
 * 回って描かれているノードの辺のスナップ（docs/06-ui.md「キャンバス直接操作」の辺のスナップ）。
 * `badge` の描き方は `drawnTurnedBadge`。運んだ先では回る前の矩形の左上から 4 右・4 上が
 * 外接矩形の左上になる。
 */

test("90 度回ったノードを運び、外接矩形の左辺が兄弟の左辺に近づいたら、外接矩形の左辺が揃う座標が書かれる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSiblings(90), onRepositionNode });
  drawnApart();
  drawnTurnedBadge();

  // 外接矩形を回る前の矩形として置くと、寄せ先がずれる
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

  // 上のテストと同じ量を運び、隙間は外接矩形で測る
  carryNode("badge", { x: 103, y: -12 });

  expect(snapGapLabels()).toEqual(["112"]);
});

import { expect, test, vi } from "vitest";
import { canvasSurface } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import { wheel } from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import {
  carryNode,
  dragNode,
  drawnAt,
  drawnTurnedAt,
  renderCanvas,
  snapGapLabels,
} from "./setup";
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

/**
 * `drawnApart` の並びを 1.2 倍で描き、`badge` を 90 度回った外接矩形にする。
 *
 * `home` の中は、左上 (100, 60) からドキュメント上の座標と大きさをそれぞれ 1.2 倍した位置に
 * 置く（`settings` は広がった `home` と重ならない右へ）。`badge` は回る前の 24x14.4 を中心 (160, 96) のまま縦に立てた矩形で、レイアウトの
 * 大きさは倍率を掛ける前の 20x12 のまま。
 */
function drawnApartZoomed(): void {
  drawnAt("home", { left: 100, top: 60, width: 432, height: 288 });
  drawnTurnedAt(
    "badge",
    { left: 152.8, top: 84, width: 14.4, height: 24 },
    { width: 20, height: 12 },
  );
  drawnAt("marker", { left: 280, top: 228, width: 96, height: 48 });
  drawnAt("card", { left: 220, top: 168, width: 144, height: 72 });
  drawnAt("label", { left: 292, top: 192, width: 48, height: 24 });
  drawnAt("settings", { left: 560, top: 100, width: 432, height: 288 });
  drawnAt("slot", { left: 632, top: 148, width: 96, height: 48 });
}

test("倍率を上げても、90 度回ったノードは外接矩形の左辺が兄弟の左辺に揃う座標が書かれる", () => {
  /*
   * 1.2 倍では外接矩形の左辺が 152.8 + 125 = 277.8 に来て、`marker` の左辺 280 へ 2.2 寄る。
   * 運んだ量 127.2 を倍率で割り戻して x は 40 + 106。回る前の大きさに倍率を掛けないと
   * 外接矩形の左辺が 277 になって 3 寄り、x は 40 + 128 / 1.2 を丸めた 147 になる
   */
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSiblings(90), onRepositionNode });
  wheel(canvasSurface(), { x: 0, y: -100 }, "ctrl");
  drawnApartZoomed();

  dragNode("badge", { x: 125, y: -12 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 146, y: 14 },
  });
});

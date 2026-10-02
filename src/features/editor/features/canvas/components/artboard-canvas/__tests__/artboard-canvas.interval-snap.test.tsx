import { expect, test, vi } from "vitest";
import { drawnInHorizontalRow, setupHorizontalRow } from "./interval-siblings";
import { carryNode, dragNode, renderCanvas, snapGuides } from "./setup";

/*
 * 兄弟の列と同じ間隔になる位置への吸い付き（docs/06-ui.md「キャンバス直接操作」の等間隔）。
 *
 * 横に 123 運ぶと `badge` の左辺は 263 — 列の後ろの端の位置（260）の 3px 先で、そこから
 * 6px 以内に辺も中心線も無い（`home` の中心線 280 とは中心線どうしで 7 離れる）。寄せが
 * 無ければ x は 163 になる。縦の 83 は、上辺 167 が `first` / `second` の上辺から 7、
 * 中心線 173 が列と `home` の中心線（180）から 7 離れていて、縦には寄らない量。
 */

test("兄弟の列の端から同じ間隔の近くまで運んで離すと、その間隔になる座標が書かれる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupHorizontalRow(), onRepositionNode });
  drawnInHorizontalRow();

  dragNode("badge", { x: 123, y: 83 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 160, y: 107 },
  });
});

test("⌘ を押しながら運ぶと、列の間隔にも吸い付かない", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupHorizontalRow(), onRepositionNode });
  drawnInHorizontalRow();

  dragNode("badge", { x: 123, y: 83 }, "meta");

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 163, y: 107 },
  });
});

test("列の端の子と縦に重ならない位置では、列の間隔に吸い付かない", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupHorizontalRow(), onRepositionNode });
  drawnInHorizontalRow();

  // 上辺 230 は `second` の下辺（200）より下。横の量は 1 件目と同じなので、重なれば 160 へ寄る
  dragNode("badge", { x: 123, y: 146 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 163, y: 170 },
  });
});

test("列の間隔へ吸い付いている間は、ガイド線が出ない", () => {
  renderCanvas({ selection: setupHorizontalRow() });
  drawnInHorizontalRow();

  // 縦は寄らない量なので、横で出るはずの線が無ければ 0 本になる
  carryNode("badge", { x: 123, y: 83 });

  expect(snapGuides()).toHaveLength(0);
});

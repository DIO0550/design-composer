import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { carryNode, dragNode, renderCanvas } from "./setup";
import { drawnApart, setupSiblings } from "./snap-siblings";

/*
 * 揃った辺に引くガイド線（docs/06-ui.md「キャンバス直接操作」の辺のスナップ）。
 * 運んでいる最中にしか出ないので、離す前の状態（`carryNode`）で見る。
 */

function guides(): readonly HTMLElement[] {
  return screen.queryAllByTestId("snap-guide");
}

test("兄弟の辺へ吸い付いている間、その辺の位置に線が出る", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();

  // 左辺が `marker` の左辺（250）の 3px 手前まで来る量
  carryNode("badge", { x: 113, y: -12 });

  /*
   * 線は `marker` の左辺に中心を合わせ、寄せたあとの `badge`（上 72）から
   * `marker` の下辺（240）までをまたぐ。
   */
  expect(guides()[0].getAttribute("style")).toContain(
    "left: 249px; top: 72px; width: 2px; height: 168px",
  );
});

test("どの辺からも遠い位置まで運んでいる間は、線が出ない", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();

  // 同じ掴み方で 113 運べば線が 1 本出る（上のテスト）。ここでは届かない量にする
  carryNode("badge", { x: 30, y: -12 });

  expect(guides()).toHaveLength(0);
});

test("縦と横の両方で揃う位置まで運ぶと、線が 2 本出る", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();

  // 左辺が `marker` の左辺へ、上辺が `card` の上辺（150）へ、それぞれ届く量
  carryNode("badge", { x: 113, y: 68 });

  expect(guides()).toHaveLength(2);
});

test("離すと線は消える", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();

  // 揃う位置まで運んで離す（運んでいる間だけの提示なので、離したあとは残らない）
  dragNode("badge", { x: 113, y: -12 });

  expect(guides()).toHaveLength(0);
});

test("ツリー内の移動では、ガイド線ではなくドロップ線が出る", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();

  // `label` は座標を持たない（`flow`）ので、運ぶとツリー内の移動になる
  carryNode("label", { x: 113, y: -12 });

  expect(guides()).toHaveLength(0);
  expect(screen.getAllByTestId("drop-marker")).toHaveLength(1);
});

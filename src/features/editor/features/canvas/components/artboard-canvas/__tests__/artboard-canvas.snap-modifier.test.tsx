import { expect, test, vi } from "vitest";
import {
  movePointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import {
  carryNode,
  dragNode,
  drawn,
  injectedStyles,
  renderCanvas,
  snapGuides,
} from "./setup";
import { drawnApart, setupSiblings } from "./snap-siblings";

/*
 * ⌘ / Ctrl を押しながら運んでいる間は吸い付かない（docs/06-ui.md「キャンバス直接操作」の
 * 辺のスナップ）。
 *
 * 運ぶ量は `badge` を 113 — 左辺が `marker` の左辺を 3px 越えた位置で、押していなければ 150 へ
 * 吸い付く（artboard-canvas.snap.test.tsx の 1 件目）。閾値の内側かつ揃う位置からずれた量に
 * しているので、修飾キーを見落とすと 150 が書かれて落ちる。
 */

test("⌘ を押しながら辺の近くまで運んで離すと、運んだ量そのままの座標が書かれる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSiblings(), onRepositionNode });
  drawnApart();

  dragNode("badge", { x: 113, y: -12 }, "meta");

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 153, y: 12 },
  });
});

test("Ctrl を押しながら辺の近くまで運んでも、吸い付かない", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSiblings(), onRepositionNode });
  drawnApart();

  dragNode("badge", { x: 113, y: -12 }, "ctrl");

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 153, y: 12 },
  });
});

test("⌘ を押しながら辺の近くまで運んでいる間は、ガイド線が出ない", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();

  // 押していなければ同じ量で線が 1 本出る（artboard-canvas.snap-guide.test.tsx の 1 件目）
  carryNode("badge", { x: 113, y: -12 }, "meta");

  expect(snapGuides()).toHaveLength(0);
});

test("⌘ を押しながら運んでいる間も、落とし先の親は枠で示される", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();

  carryNode("badge", { x: 113, y: -12 }, "meta");

  expect(injectedStyles()).toContain('[data-name="home"]{outline:2px dashed');
});

test("⌘ を離して動かし直すと、同じ位置でも再び吸い付く", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSiblings(), onRepositionNode });
  drawnApart();

  // 押している「間」だけ効くことを見るので、1 回のドラッグの中で押していない移動を続ける
  carryNode("badge", { x: 113, y: -12 }, "meta");
  movePointer(drawn("badge"), { x: 213, y: 88 });
  releasePointer(drawn("badge"), { x: 213, y: 88 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 150, y: 12 },
  });
});

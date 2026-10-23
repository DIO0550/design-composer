import { expect, test, vi } from "vitest";
import {
  artboardFrameContainer,
  artboardHandle,
  canvasContent,
} from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { renderCanvas, snapGuides } from "./setup";
import {
  carrySecond,
  dragSecond,
  drawnFollowingFrames,
  setupSelection,
} from "./snap-artboards";

/*
 * ⌘ / Ctrl を押しながら artboard を運んでいる間は吸い付かない（docs/06-ui.md「artboard の
 * 移動」の辺のスナップ）。
 *
 * 運ぶ量は `second`（左 232）を (-29, 30) — 左辺が `first` の右辺 200 を 3px 越えた位置で、
 * 押していなければ 200 へ吸い付く（artboard-canvas.artboard-snap.test.tsx の 1 件目）。閾値の
 * 内側かつ揃う位置からずれた量にしているので、修飾キーを見落とすと 200 が書かれて落ちる。
 */

test("⌘ を押しながら他の artboard の辺の近くまで運んで離すと、運んだ量そのままの座標が書かれる", () => {
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });
  drawnFollowingFrames();

  dragSecond({ x: -29, y: 30 }, "meta");

  expect(onRepositionArtboard).toHaveBeenCalledWith("second", {
    x: 203,
    y: 30,
  });
});

test("Ctrl を押しながら他の artboard の辺の近くまで運んでも、吸い付かない", () => {
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });
  drawnFollowingFrames();

  dragSecond({ x: -29, y: 30 }, "ctrl");

  expect(onRepositionArtboard).toHaveBeenCalledWith("second", {
    x: 203,
    y: 30,
  });
});

test("⌘ を押しながら他の artboard の辺の近くまで運んでいる間は、ガイド線が出ない", () => {
  renderCanvas({ selection: setupSelection() });
  drawnFollowingFrames();

  // 押していなければ同じ量で線が 1 本出る（artboard-canvas.artboard-snap-guide.test.tsx の 1 件目）
  carrySecond({ x: -29, y: 30 }, "meta");

  expect(snapGuides()).toHaveLength(0);
});

test("⌘ を押しながら運んでいる間は、見た目も運んだ量そのままの位置に描かれる", () => {
  renderCanvas({ selection: setupSelection() });
  drawnFollowingFrames();

  carrySecond({ x: -29, y: 30 }, "meta");

  const { style } = artboardFrameContainer(canvasContent(), "second");
  expect([style.left, style.top]).toEqual(["203px", "30px"]);
});

test("⌘ を離して動かし直すと、同じ位置でも再び吸い付く", () => {
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });
  drawnFollowingFrames();

  // 押している「間」だけ効くことを見るので、1 回のドラッグの中で押していない移動を続ける
  carrySecond({ x: -29, y: 30 }, "meta");
  movePointer(artboardHandle("second"), { x: -29, y: 30 });
  releasePointer(artboardHandle("second"), { x: -29, y: 30 });

  expect(onRepositionArtboard).toHaveBeenCalledWith("second", {
    x: 200,
    y: 30,
  });
});

test("押さずに吸い付かせたあと ⌘ を押して同じ位置で動かすと、吸い付きが外れる", () => {
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });
  drawnFollowingFrames();

  // 運んでいる間は線が 1 → 0 本になり、離したあとは運んだ量そのままの座標が書かれる
  pressPointer(artboardHandle("second"), { x: 0, y: 0 });
  movePointer(canvasContent(), { x: -29, y: 30 });
  expect(snapGuides()).toHaveLength(1);
  movePointer(canvasContent(), { x: -29, y: 30 }, "meta");
  expect(snapGuides()).toHaveLength(0);
  releasePointer(canvasContent(), { x: -29, y: 30 });

  expect(onRepositionArtboard).toHaveBeenCalledWith("second", {
    x: 203,
    y: 30,
  });
});

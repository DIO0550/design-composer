import { expect, test } from "vitest";
import {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import {
  BadgeBounds,
  drawnApart,
  HomeBounds,
  setupSelection,
} from "./resize-snap-siblings";
import { distanceLabels, drawnAt, renderCanvas, snapGuides } from "./setup";

/*
 * リサイズで掴んだ辺が揃ったときのガイド線（docs/06-ui.md「リサイズハンドル」の辺のスナップ）。
 * 運んでいる最中にしか出ないので、離す前に見る。
 *
 * `badge` は上 80・下 120、`marker` は上 160・下 200・右 263 に描かれている。右辺の帯を
 * 218 → 258 と運ぶと右辺は 260 まで来て、`marker` の右辺 263 へ吸い付く。
 */

test("右辺の帯を兄弟の右辺の近くまで運んでいる間、兄弟の右辺に線が 1 本出る", () => {
  renderCanvas({ selection: setupSelection(["badge"]) });
  drawnApart();
  const badge = drawnAt("badge", BadgeBounds);

  pressPointer(badge, { x: 218, y: 100 });
  movePointer(badge, { x: 258, y: 100 });

  // `marker` の右辺に中心を合わせ、`badge` の上辺 80 から `marker` の下辺 200 までをまたぐ
  expect(snapGuides()).toHaveLength(1);
  expect(snapGuides()[0].getAttribute("style")).toContain(
    "left: 262px; top: 80px; width: 2px; height: 120px",
  );
});

test("右辺の帯を兄弟の右辺の近くまで運んでいる間、揃え先との隙間の数値は出ない", () => {
  renderCanvas({ selection: setupSelection(["badge"]) });
  drawnApart();
  const badge = drawnAt("badge", BadgeBounds);

  // `badge` の下辺 120 と `marker` の上辺 160 の間は 40 空いている（移動なら「40」が出る）
  pressPointer(badge, { x: 218, y: 100 });
  movePointer(badge, { x: 258, y: 100 });

  expect(snapGuides()).toHaveLength(1);
  expect(distanceLabels("snap-gap")).toEqual([]);
});

test("離すと線は消える", () => {
  renderCanvas({ selection: setupSelection(["badge"]) });
  drawnApart();
  const badge = drawnAt("badge", BadgeBounds);

  pressPointer(badge, { x: 218, y: 100 });
  movePointer(badge, { x: 258, y: 100 });
  releasePointer(badge, { x: 258, y: 100 });

  expect(snapGuides()).toHaveLength(0);
});

test("⌘ を押しながら兄弟の右辺の近くまで運んでいる間は、線が出ない", () => {
  renderCanvas({ selection: setupSelection(["badge"]) });
  drawnApart();
  const badge = drawnAt("badge", BadgeBounds);

  pressPointer(badge, { x: 218, y: 100 });
  movePointer(badge, { x: 258, y: 100 }, "meta");

  expect(snapGuides()).toHaveLength(0);
});

test("押さずに吸い付かせたあと ⌘ を押して動かすと、線が消える", () => {
  renderCanvas({ selection: setupSelection(["badge"]) });
  drawnApart();
  const badge = drawnAt("badge", BadgeBounds);

  pressPointer(badge, { x: 218, y: 100 });
  movePointer(badge, { x: 258, y: 100 });
  movePointer(badge, { x: 258, y: 100 }, "meta");

  expect(snapGuides()).toHaveLength(0);
});

test("artboard の右辺を他の artboard の左辺の近くまで運んでいる間、その左辺に線が出る", () => {
  renderCanvas({ selection: setupSelection(["home"]) });
  drawnApart();
  const home = drawnAt("home", HomeBounds);

  // 右辺が 497 まで来て、`settings` の左辺 500 へ吸い付く
  pressPointer(home, { x: 458, y: 280 });
  movePointer(home, { x: 495, y: 280 });

  expect(
    snapGuides().map((guide) => guide.getAttribute("style") ?? ""),
  ).toEqual([expect.stringContaining("left: 499px")]);
});

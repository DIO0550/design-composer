import { expect, test } from "vitest";
import { canvasSurface } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  movePointer,
  pressPointer,
  releasePointer,
  wheel,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import {
  BadgeBounds,
  drawnApart,
  HomeBounds,
  setupSelection,
} from "./resize-snap-siblings";
import {
  drawnAt,
  renderCanvas,
  resizeHandleAt,
  sortedFacingDistanceLabels,
} from "./setup";

/*
 * Alt / Option を押しながらリサイズしている間の、掴んだ辺から外へ最初に当たる相手までの距離
 * （docs/06-ui.md「リサイズハンドル」）。動かしている最中にしか出ないので、離す前に見る。
 *
 * `badge` は左右 120〜220・上下 80〜120、`marker` は左右 120〜263・上下 160〜200、`home` は
 * 左右 100〜460・上下 60〜300 に描かれている。右辺の帯を 218 → 238 と運ぶと右辺は 240 で、
 * どの辺からも吸い付く距離の外にあり、右に当たるのは `home` の右の縁（220 先）。左・上・下にも
 * 相手（`home` の縁と `marker`）がいる。
 */

test("Alt を押しながら右辺を動かしている間、右の最初に当たる相手（親の縁）までの距離だけが出る", () => {
  renderCanvas({ selection: setupSelection(["badge"]) });
  drawnApart();
  const badge = drawnAt("badge", BadgeBounds);

  // 左（`home` の縁まで 20）・上（20）・下（`marker` まで 40）は出ない
  pressPointer(badge, { x: 218, y: 100 });
  movePointer(badge, { x: 238, y: 100 }, "alt");

  expect(sortedFacingDistanceLabels()).toEqual(["220"]);
});

test("Alt を押しながら右下の角を動かしている間、右と下の最初に当たる相手までの距離が出る", () => {
  renderCanvas({ selection: setupSelection(["badge"]) });
  drawnApart();
  const badge = drawnAt("badge", BadgeBounds);

  // 右辺 240・下辺 130。右は `home` の縁まで 220、下は `marker` まで 30
  pressPointer(resizeHandleAt({ x: 1, y: 1 }), { x: 220, y: 120 });
  movePointer(badge, { x: 240, y: 130 }, "alt");

  expect(sortedFacingDistanceLabels()).toEqual(["220", "30"]);
});

test("Alt を押さずに動かしている間は、距離が出ない", () => {
  renderCanvas({ selection: setupSelection(["badge"]) });
  drawnApart();
  const badge = drawnAt("badge", BadgeBounds);

  pressPointer(badge, { x: 218, y: 100 });
  movePointer(badge, { x: 238, y: 100 });

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

test("Alt を押さずに動かしてから Alt を押して動かすと、距離が出る", () => {
  renderCanvas({ selection: setupSelection(["badge"]) });
  drawnApart();
  const badge = drawnAt("badge", BadgeBounds);

  pressPointer(badge, { x: 218, y: 100 });
  movePointer(badge, { x: 228, y: 100 });
  movePointer(badge, { x: 238, y: 100 }, "alt");

  expect(sortedFacingDistanceLabels()).toEqual(["220"]);
});

test("Alt を押して距離を出したあと、離して動かすと距離が消える", () => {
  renderCanvas({ selection: setupSelection(["badge"]) });
  drawnApart();
  const badge = drawnAt("badge", BadgeBounds);

  pressPointer(badge, { x: 218, y: 100 });
  movePointer(badge, { x: 238, y: 100 }, "alt");
  movePointer(badge, { x: 239, y: 100 });

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

test("ポインタを離すと、距離が消える", () => {
  renderCanvas({ selection: setupSelection(["badge"]) });
  drawnApart();
  const badge = drawnAt("badge", BadgeBounds);

  pressPointer(badge, { x: 218, y: 100 });
  movePointer(badge, { x: 238, y: 100 }, "alt");
  releasePointer(badge, { x: 238, y: 100 });

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

test("倍率を上げて動かしている間も、距離はドキュメント上の px で出る", () => {
  renderCanvas({ selection: setupSelection(["badge"]) });
  wheel(canvasSurface(), { x: 0, y: -100 }, "ctrl");

  // 1.2 倍で見ているときの描かれた矩形（`drawnApart` の並びを 1.2 倍したもの）
  drawnAt("home", { left: 120, top: 72, width: 432, height: 288 });
  drawnAt("marker", { left: 144, top: 192, width: 171.6, height: 48 });
  drawnAt("settings", { left: 600, top: 72, width: 360, height: 288 });
  const badge = drawnAt("badge", {
    left: 144,
    top: 96,
    width: 120,
    height: 48,
  });

  /*
   * 画面上で 24 引くと幅は 20 伸び、右辺は画面上で 288。`home` の右の縁 552 まで画面上で
   * 264・ドキュメント上で 220。倍率を表示へ渡し忘れると画面上の値（264）が出る。
   */
  pressPointer(badge, { x: 262, y: 120 });
  movePointer(badge, { x: 286, y: 120 }, "alt");

  expect(sortedFacingDistanceLabels()).toEqual(["220"]);
});

test("Alt を押したままでも掴んだ辺は吸い付き、吸い付いたあとの辺から測る", () => {
  renderCanvas({ selection: setupSelection(["badge"]) });
  drawnApart();
  const badge = drawnAt("badge", BadgeBounds);

  // 右辺は 260 まで来て `marker` の右辺 263 へ吸い付く。吸い付かなければ 200
  pressPointer(badge, { x: 218, y: 100 });
  movePointer(badge, { x: 258, y: 100 }, "alt");

  expect(sortedFacingDistanceLabels()).toEqual(["197"]);
});

test("⌘ と Alt を押しながら動かすと、吸い付かない位置から測る", () => {
  renderCanvas({ selection: setupSelection(["badge"]) });
  drawnApart();
  const badge = drawnAt("badge", BadgeBounds);

  pressPointer(badge, { x: 218, y: 100 });
  movePointer(badge, { x: 258, y: 100 }, "meta+alt");

  expect(sortedFacingDistanceLabels()).toEqual(["200"]);
});

test("Alt を押しながら artboard の右辺を動かすと、右の artboard までの距離が出る", () => {
  renderCanvas({ selection: setupSelection(["home"]) });
  drawnApart();
  const home = drawnAt("home", HomeBounds);

  // 右辺は 472 まで来る。`settings` の左辺 500 まで 28
  pressPointer(home, { x: 458, y: 280 });
  movePointer(home, { x: 470, y: 280 }, "alt");

  expect(sortedFacingDistanceLabels()).toEqual(["28"]);
});

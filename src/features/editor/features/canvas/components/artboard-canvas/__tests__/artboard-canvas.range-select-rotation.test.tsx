import { expect, test, vi } from "vitest";
import type { DocumentSelection } from "@/domains/session/document-selection";
import { canvasSurface } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  drag,
  wheel,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { stubLayoutSize } from "@/features/editor/features/canvas/__tests__/canvas-measure";
import { drawnAt, renderCanvas, selectionFromArtboards } from "./setup";

/*
 * 回って描かれているノードを範囲選択で拾う判定を、範囲を引くところから通す
 * （docs/06-ui.md「範囲選択」）。重なりの幾何そのものは `rotated-bounds.overlap` が持ち、
 * ここは向きがドキュメントから、倍率が表示から判定まで届くことを見る。
 */

/** `turned` と `plain` の大きさ。 */
const Square = { width: 100, height: 100 };

/**
 * `home` に、`rotation` だけ回した絶対配置の Box `turned` と、回していない Box `plain` が
 * 同じ大きさで並ぶ状態。
 *
 * @param rotation `turned` の向き（度）
 * @param size `turned` と `plain` の幅と高さ
 * @returns ドキュメントと、何も選んでいない選択の対
 */
function setupTurned(
  rotation: number,
  size: Readonly<{ width: number; height: number }>,
): DocumentSelection {
  const placed = {
    widthMode: "fixed",
    width: size.width,
    heightMode: "fixed",
    height: size.height,
    placement: "absolute",
    x: 100,
    y: 50,
  };
  return selectionFromArtboards([
    {
      name: "home",
      width: 360,
      height: 240,
      children: [
        {
          name: "turned",
          type: "Box",
          props: { ...placed, rotation },
          children: [],
        },
        { name: "plain", type: "Box", props: placed, children: [] },
      ],
    },
  ]);
}

/**
 * `turned` を外接矩形 (130, 80) から 140 四方、中心 (200, 150) に描き、`plain` を
 * (70, 50) から 20 四方に描く。
 *
 * @returns 測定を差し替えたあとの `turned`
 */
function drawTurnedAndPlain(): HTMLElement {
  drawnAt("plain", { left: 70, top: 50, width: 20, height: 20 });
  return drawnAt("turned", { left: 130, top: 80, width: 140, height: 140 });
}

test("45 度回したノードは、外接矩形の隅にだけかかる範囲では選ばれない", () => {
  // 回った左上の辺は x + y ≒ 279.3 の上にあり、範囲の右下 (150, 100) はその外側
  const onSelectInRange = vi.fn();
  renderCanvas({ selection: setupTurned(45, Square), onSelectInRange });
  stubLayoutSize(drawTurnedAndPlain(), { width: 100, height: 100 });

  drag(canvasSurface(), { from: { x: 60, y: 40 }, to: { x: 150, y: 100 } });

  expect(onSelectInRange).toHaveBeenLastCalledWith(["plain"]);
});

test("45 度回したノードは、回った矩形まで届いた範囲で選ばれる", () => {
  const onSelectInRange = vi.fn();
  renderCanvas({ selection: setupTurned(45, Square), onSelectInRange });
  stubLayoutSize(drawTurnedAndPlain(), { width: 100, height: 100 });

  drag(canvasSurface(), { from: { x: 60, y: 40 }, to: { x: 180, y: 130 } });

  expect(onSelectInRange).toHaveBeenLastCalledWith(["turned", "plain"]);
});

test("時計回りに 30 度回した横長は、回る前の右下の角が来た側にかかる範囲で選ばれる", () => {
  /*
   * 中心 (200, 150) の 200x100 を 30 度回すと、回る前の右下の角は (261.6, 243.3) に来る。
   * 範囲 (240, 220)〜(264, 240) はその角にかかり、反時計回りに回したものとは重ならない
   */
  const onSelectInRange = vi.fn();
  renderCanvas({
    selection: setupTurned(30, { width: 200, height: 100 }),
    onSelectInRange,
  });
  const turned = drawnAt("turned", {
    left: 88.3975,
    top: 56.6987,
    width: 223.2051,
    height: 186.6025,
  });
  stubLayoutSize(turned, { width: 200, height: 100 });

  drag(canvasSurface(), { from: { x: 240, y: 220 }, to: { x: 264, y: 240 } });

  expect(onSelectInRange).toHaveBeenLastCalledWith(["turned"]);
});

test("倍率を上げても、45 度回したノードは画面上の回った矩形で判定される", () => {
  /*
   * 1.2 倍では回る前の大きさが画面上で 120 四方になり、回った左上の辺は x + y ≒ 265.1 の
   * 上に来る。範囲の右下 (125, 150) はその内側で、倍率を掛けない 100 四方（≒ 279.3）の外側
   */
  const onSelectInRange = vi.fn();
  renderCanvas({ selection: setupTurned(45, Square), onSelectInRange });
  wheel(canvasSurface(), { x: 0, y: -100 }, "ctrl");
  const turned = drawnAt("turned", {
    left: 115,
    top: 65,
    width: 170,
    height: 170,
  });
  stubLayoutSize(turned, { width: 100, height: 100 });

  drag(canvasSurface(), { from: { x: 60, y: 40 }, to: { x: 125, y: 150 } });

  expect(onSelectInRange).toHaveBeenLastCalledWith(["turned"]);
});

test("1 回り回したノードは、外接矩形の隅にかかる範囲で選ばれる", () => {
  // レイアウトの大きさは差し替えない（happy-dom では 0）。回っていないものとして外接矩形で測る
  const onSelectInRange = vi.fn();
  renderCanvas({ selection: setupTurned(360, Square), onSelectInRange });
  drawTurnedAndPlain();

  drag(canvasSurface(), { from: { x: 60, y: 40 }, to: { x: 150, y: 100 } });

  expect(onSelectInRange).toHaveBeenLastCalledWith(["turned", "plain"]);
});

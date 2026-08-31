import { expect, test } from "vitest";
import { Artboard } from "../index";

/**
 * 置き直す前の artboard。
 *
 * @returns 座標を持たない 375×812 の artboard
 */
function setupArtboard(): Artboard {
  return Artboard.create({ name: "screen", width: 375, height: 812 });
}

test("キャンバス上の位置を置き直すと、その座標を持つ", () => {
  // x と y を別の値にする（取り違えても同じ答えになる入力を避ける）
  const moved = Artboard.withCanvasPosition(setupArtboard(), {
    x: 900,
    y: 300,
  });

  expect(moved.canvasPosition).toEqual({ x: 900, y: 300 });
});

test("置き直しても元の artboard は変わらない", () => {
  const artboard = setupArtboard();

  Artboard.withCanvasPosition(artboard, { x: 900, y: 300 });

  expect(artboard.canvasPosition).toBeUndefined();
});

test("小数の座標は整数へ丸められる", () => {
  /*
   * 倍率の割り戻しで 1px 未満の差が出る。ファイルへ残すと、同じ操作から来る値が
   * サイズと座標で違う粒度になる（`Placement.moveBy` と同じ理由）。
   */
  const moved = Artboard.withCanvasPosition(setupArtboard(), {
    x: 12.4,
    y: -7.6,
  });

  expect(moved.canvasPosition).toEqual({ x: 12, y: -8 });
});

test("置き直しても大きさと中身は変わらない", () => {
  const moved = Artboard.withCanvasPosition(setupArtboard(), {
    x: 900,
    y: 300,
  });

  expect([moved.width, moved.height, moved.children]).toStrictEqual([
    375,
    812,
    [],
  ]);
});

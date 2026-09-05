import { expect, test } from "vitest";
import type { CanvasBounds } from "@/features/canvas/domains/node-drop";
import { Option } from "@/utils/Option";
import { CanvasView } from "../index";

/*
 * 収める倍率と位置。
 *
 * 入力の見え方は**等倍でも原点でもない**ものを使う（`ScaledView`）。既定と同じにすると、
 * 割り戻しを丸ごと落として「いつも既定を返す」実装でも通ってしまう
 * （rules/testing.md「既定値・フォールバックがある処理では、既定値と違う答えになる入力を選ぶ」）。
 */

/** キャンバスの土台。左上を 0 以外にして、土台からの相対に直していることが見えるようにする。 */
const Viewport: CanvasBounds = { left: 100, top: 50, width: 800, height: 600 };

/** 倍率 2・原点をずらした状態。押した時点の見え方が既定でないことを表す。 */
const ScaledView: CanvasView = {
  scale: 2,
  offset: { x: -40, y: 30 },
  dragFrom: Option.none,
};

/**
 * ドキュメント上の矩形を、`view` で描いたときの client 座標の矩形に直す。
 * 実測で届くのは描かれている矩形なので、テストの入力も同じ形にする。
 */
function drawnAs(
  view: CanvasView,
  document: CanvasBounds,
  viewport: CanvasBounds,
): CanvasBounds {
  return {
    left: viewport.left + document.left * view.scale + view.offset.x,
    top: viewport.top + document.top * view.scale + view.offset.y,
    width: document.width * view.scale,
    height: document.height * view.scale,
  };
}

/**
 * 収める対象。横長なので**横のほうが厳しく**、余白 24px を四辺へ足すと
 * 幅 1600・高さ 400 になり、倍率は 800 / 1600 = 0.5 で決まる
 * （余白を落とすと 800 / 1552 になるので、この期待値は余白ごと守る）。
 */
const WideContent: CanvasBounds = {
  left: 100,
  top: 50,
  width: 1552,
  height: 352,
};

test("対象が画面に収まる倍率になる", () => {
  const fitted = CanvasView.fitTo(ScaledView, {
    target: drawnAs(ScaledView, WideContent, Viewport),
    viewport: Viewport,
  });

  expect(fitted.scale).toBe(0.5);
});

test("対象が画面の中央に来る位置になる", () => {
  const fitted = CanvasView.fitTo(ScaledView, {
    target: drawnAs(ScaledView, WideContent, Viewport),
    viewport: Viewport,
  });

  // 横は余りが無く、縦は 600 - 400 × 0.5 = 400 の半分ずつが上下に空く
  expect(fitted.offset).toEqual({ x: -38, y: 187 });
});

test("縦のほうが厳しければ、縦で収まる倍率が選ばれる", () => {
  // 余白込みで 400 × 1600。縦が 600 / 1600 = 0.375、横は 800 / 400 = 2
  const tall: CanvasBounds = { left: 0, top: 0, width: 352, height: 1552 };

  const fitted = CanvasView.fitTo(ScaledView, {
    target: drawnAs(ScaledView, tall, Viewport),
    viewport: Viewport,
  });

  expect(fitted.scale).toBe(0.375);
});

test("押した時点の倍率と位置が違っても、同じ対象なら同じ結果になる", () => {
  /*
   * 描かれている矩形は倍率と位置で変わるが、収まる倍率と位置は対象そのもので決まる。
   * 割り戻し（`view.scale` / `view.offset` を使う部分）を落とすと、この 1 件だけが落ちる。
   */
  const plain = CanvasView.create();

  const fromScaled = CanvasView.fitTo(ScaledView, {
    target: drawnAs(ScaledView, WideContent, Viewport),
    viewport: Viewport,
  });
  const fromPlain = CanvasView.fitTo(plain, {
    target: drawnAs(plain, WideContent, Viewport),
    viewport: Viewport,
  });

  expect(fromPlain).toEqual(fromScaled);
});

test("収まる倍率が上限を超えるときは上限で止まる", () => {
  // 余白込みでも 50 × 50 なので、収めるだけなら 12 倍まで寄れる
  const tiny: CanvasBounds = { left: 0, top: 0, width: 2, height: 2 };

  const fitted = CanvasView.fitTo(ScaledView, {
    target: drawnAs(ScaledView, tiny, Viewport),
    viewport: Viewport,
  });

  expect(fitted.scale).toBe(4);
});

test("上限で止まったあとも、対象は画面の中央に来る", () => {
  /*
   * 倍率だけを上限で止めて位置を止める前の倍率で出すと、対象が画面の外へ飛ぶ
   * （ここでは 12 倍ぶんずらした位置になる）。倍率と位置は別々の判断なので、
   * 倍率を見る 1 つ上のテストとは分けて置く。
   */
  const tiny: CanvasBounds = { left: 0, top: 0, width: 2, height: 2 };

  const fitted = CanvasView.fitTo(ScaledView, {
    target: drawnAs(ScaledView, tiny, Viewport),
    viewport: Viewport,
  });

  // 余白込みの 50 × 50 を 4 倍で置くので、横は (800 - 200) / 2、縦は (600 - 200) / 2
  expect(fitted.offset).toEqual({ x: 396, y: 296 });
});

test("収まる倍率が下限を下回るときは下限で止まる", () => {
  // 収めるだけなら 0.008 倍まで縮む
  const huge: CanvasBounds = { left: 0, top: 0, width: 100_000, height: 2 };

  const fitted = CanvasView.fitTo(ScaledView, {
    target: drawnAs(ScaledView, huge, Viewport),
    viewport: Viewport,
  });

  expect(fitted.scale).toBe(0.1);
});

test("対象に面積が無ければ見え方は変わらない", () => {
  const flat: CanvasBounds = { left: 0, top: 0, width: 352, height: 0 };

  const fitted = CanvasView.fitTo(ScaledView, {
    target: drawnAs(ScaledView, flat, Viewport),
    viewport: Viewport,
  });

  expect(fitted).toEqual(ScaledView);
});

test("収める先に面積が無ければ見え方は変わらない", () => {
  // 土台が畳まれて面積を持たないときに当たる（押下はレイアウトの後なので、
  // マウント直後には到達しない）
  const unlaidViewport: CanvasBounds = {
    left: 100,
    top: 50,
    width: 0,
    height: 0,
  };

  const fitted = CanvasView.fitTo(ScaledView, {
    target: drawnAs(ScaledView, WideContent, Viewport),
    viewport: unlaidViewport,
  });

  expect(fitted).toEqual(ScaledView);
});
